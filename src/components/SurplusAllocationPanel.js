import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  InputNumber,
  Button,
  Table,
  message,
  Space,
  Typography,
  Popconfirm,
} from 'antd';
import api, { addCourseIdToQuery } from '../services/api';
import {
  aggregateStudentCategories,
  buildClassCategoryTotals,
  buildAllocationSumsCourse,
} from '../utils/surplusAllocations';

const { Text } = Typography;
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

const SurplusAllocationPanel = ({ courseId, rawExpenseRows, allocations, onRefresh }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [fromCat, setFromCat] = useState(undefined);
  const [toCat, setToCat] = useState(undefined);

  const sums = useMemo(() => buildAllocationSumsCourse(allocations), [allocations]);

  const agg = useMemo(() => aggregateStudentCategories(rawExpenseRows), [rawExpenseRows]);

  const classTotals = useMemo(() => buildClassCategoryTotals(agg), [agg]);

  const surplusAvailCat = useCallback(
    (cid) => {
      const raw = classTotals.surplusTotalByCat.get(cid) || 0;
      const out = sums.out.get(cid) || 0;
      return round2(raw - out);
    },
    [classTotals, sums]
  );

  const deficitAvailCat = useCallback(
    (cid) => {
      const raw = classTotals.deficitTotalByCat.get(cid) || 0;
      const inn = sums.inn.get(cid) || 0;
      return round2(raw - inn);
    },
    [classTotals, sums]
  );

  const categoryMeta = useMemo(() => {
    const m = new Map();
    agg.forEach((catMap) => {
      catMap.forEach((cell, cid) => {
        if (!m.has(cid)) m.set(cid, cell.categoryName);
      });
    });
    return m;
  }, [agg]);

  const fromOptions = useMemo(() => {
    const opts = [];
    classTotals.surplusTotalByCat.forEach((_, cid) => {
      const avail = surplusAvailCat(cid);
      if (avail > 0.005) {
        opts.push({
          value: cid,
          label: `${categoryMeta.get(cid) || cid} — excedente curso ${money(avail)} disp.`,
        });
      }
    });
    return opts.sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [classTotals, surplusAvailCat, categoryMeta]);

  const toOptions = useMemo(() => {
    const opts = [];
    classTotals.deficitTotalByCat.forEach((_, cid) => {
      if (fromCat != null && Number(fromCat) === cid) return;
      const avail = deficitAvailCat(cid);
      if (avail > 0.005) {
        opts.push({
          value: cid,
          label: `${categoryMeta.get(cid) || cid} — déficit curso ${money(avail)} a cubrir`,
        });
      }
    });
    return opts.sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [classTotals, deficitAvailCat, categoryMeta, fromCat]);

  const maxAmount = useMemo(() => {
    if (fromCat == null || toCat == null) return null;
    const a = surplusAvailCat(Number(fromCat));
    const b = deficitAvailCat(Number(toCat));
    const m = Math.min(a, b);
    return m > 0.005 ? round2(m) : null;
  }, [fromCat, toCat, surplusAvailCat, deficitAvailCat]);

  useEffect(() => {
    if (maxAmount != null) {
      const cur = form.getFieldValue('amount');
      if (cur == null || cur > maxAmount) form.setFieldsValue({ amount: maxAmount });
    }
  }, [maxAmount, form]);

  const handleSubmit = async (values) => {
    if (!courseId) return;
    const max = Math.min(
      surplusAvailCat(Number(values.from_category_id)),
      deficitAvailCat(Number(values.to_category_id))
    );
    if (values.amount > max + 0.01) {
      message.error(`El monto no puede superar ${money(max)}`);
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/surplus-allocations', {
        course_id: courseId,
        from_category_id: values.from_category_id,
        to_category_id: values.to_category_id,
        amount: values.amount,
      });
      message.success('Asignación guardada (nivel curso)');
      form.resetFields();
      setFromCat(undefined);
      setToCat(undefined);
      onRefresh();
    } catch (e) {
      const msg = e.response?.data?.error || 'Error al guardar';
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(addCourseIdToQuery(`/surplus-allocations/${id}`, courseId));
      message.success('Eliminado');
      onRefresh();
    } catch (e) {
      message.error(e.response?.data?.error || 'Error al eliminar');
    }
  };

  const columns = [
    { title: 'Desde', dataIndex: 'from_category_name', key: 'f' },
    { title: 'Hacia', dataIndex: 'to_category_name', key: 't' },
    { title: 'Monto', dataIndex: 'amount', key: 'a', width: 100, render: (v) => money(v) },
    {
      title: '',
      key: 'act',
      width: 72,
      render: (_, row) => (
        <Popconfirm title="¿Eliminar esta asignación?" onConfirm={() => handleDelete(row.id)}>
          <Button type="link" danger size="small">
            Quitar
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card title="Asignación de excedentes (todo el curso)" bordered={false} className="surplus-panel-card">
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        El excedente y el déficit se calculan sumando a todos los estudiantes por categoría. Lo que asignas aquí
        afecta a la vista del dashboard repartiendo el efecto en cada alumno de forma proporcional a su ahorro o
        sobregasto en esa categoría.
      </Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginBottom: 20 }}
        size="small"
      >
        <Space wrap align="start">
          <Form.Item
            name="from_category_id"
            label="Origen (excedente del curso)"
            rules={[{ required: true, message: 'Origen' }]}
            style={{ minWidth: 280 }}
          >
            <Select
              placeholder="Categoría con ahorro agregado"
              options={fromOptions}
              onChange={(v) => {
                setFromCat(v);
                setToCat(undefined);
                form.setFieldsValue({ to_category_id: undefined });
              }}
            />
          </Form.Item>
          <Form.Item
            name="to_category_id"
            label="Destino (déficit del curso)"
            rules={[{ required: true, message: 'Destino' }]}
            style={{ minWidth: 280 }}
          >
            <Select
              placeholder="Categoría con sobregasto agregado"
              options={toOptions}
              onChange={(v) => setToCat(v)}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label={maxAmount != null ? `Monto (máx. ${money(maxAmount)})` : 'Monto'}
            rules={[{ required: true, message: 'Monto' }]}
            style={{ width: 140 }}
          >
            <InputNumber
              min={0.01}
              max={maxAmount || undefined}
              step={0.01}
              precision={2}
              style={{ width: '100%' }}
              disabled={maxAmount == null}
            />
          </Form.Item>
          <Form.Item label=" ">
            <Button type="primary" htmlType="submit" loading={submitting} disabled={maxAmount == null}>
              Guardar
            </Button>
          </Form.Item>
        </Space>
      </Form>

      <div className="dashboard-alloc-subtitle">Asignaciones guardadas (este curso)</div>
      <Table
        size="small"
        rowKey="id"
        columns={columns}
        dataSource={allocations || []}
        pagination={{ pageSize: 8 }}
        locale={{ emptyText: 'Ninguna asignación aún' }}
      />
    </Card>
  );
};

export default SurplusAllocationPanel;
