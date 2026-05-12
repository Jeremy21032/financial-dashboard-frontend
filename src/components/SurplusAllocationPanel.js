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
  normStudentId,
  aggregateStudentCategories,
  buildAllocationSums,
} from '../utils/surplusAllocations';

const { Text } = Typography;
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

const SurplusAllocationPanel = ({ courseId, rawExpenseRows, allocations, onRefresh }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState(undefined);
  const [fromCat, setFromCat] = useState(undefined);
  const [toCat, setToCat] = useState(undefined);

  const sums = useMemo(() => buildAllocationSums(allocations), [allocations]);

  const studentOptions = useMemo(() => {
    const m = new Map();
    (rawExpenseRows || []).forEach((e) => {
      const sid = normStudentId(e.studentID);
      if (!sid) return;
      if (!m.has(sid)) m.set(sid, e.student_name || sid);
    });
    return Array.from(m.entries()).map(([id, name]) => ({ value: id, label: name }));
  }, [rawExpenseRows]);

  const agg = useMemo(() => aggregateStudentCategories(rawExpenseRows), [rawExpenseRows]);

  const surplusAvailable = useCallback(
    (sid, cid) => {
      const cell = agg.get(sid)?.get(cid);
      if (!cell || !(cell.budget > 0)) return 0;
      const surplusRaw = Math.max(0, round2(cell.budget - cell.spent));
      const fk = `${sid}::${cid}`;
      const out = sums.out.get(fk) || 0;
      return round2(surplusRaw - out);
    },
    [agg, sums]
  );

  const deficitAvailable = useCallback(
    (sid, cid) => {
      const cell = agg.get(sid)?.get(cid);
      if (!cell || !(cell.budget > 0)) return 0;
      const deficitRaw = Math.max(0, round2(cell.spent - cell.budget));
      const tk = `${sid}::${cid}`;
      const inn = sums.inn.get(tk) || 0;
      return round2(deficitRaw - inn);
    },
    [agg, sums]
  );

  const fromOptions = useMemo(() => {
    if (!studentId) return [];
    const sid = normStudentId(studentId);
    const catMap = agg.get(sid);
    if (!catMap) return [];
    const opts = [];
    catMap.forEach((cell, cid) => {
      const avail = surplusAvailable(sid, cid);
      if (avail > 0.005) {
        opts.push({
          value: cid,
          label: `${cell.categoryName} (${money(avail)} disp.)`,
        });
      }
    });
    return opts.sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [studentId, agg, surplusAvailable]);

  const toOptions = useMemo(() => {
    if (!studentId) return [];
    const sid = normStudentId(studentId);
    const catMap = agg.get(sid);
    if (!catMap) return [];
    const opts = [];
    catMap.forEach((cell, cid) => {
      if (fromCat != null && Number(fromCat) === cid) return;
      const avail = deficitAvailable(sid, cid);
      if (avail > 0.005) {
        opts.push({
          value: cid,
          label: `${cell.categoryName} (${money(avail)} a cubrir)`,
        });
      }
    });
    return opts.sort((a, b) => String(a.label).localeCompare(String(b.label)));
  }, [studentId, agg, deficitAvailable, fromCat]);

  const maxAmount = useMemo(() => {
    if (!studentId || fromCat == null || toCat == null) return null;
    const sid = normStudentId(studentId);
    const a = surplusAvailable(sid, Number(fromCat));
    const b = deficitAvailable(sid, Number(toCat));
    const m = Math.min(a, b);
    return m > 0.005 ? round2(m) : null;
  }, [studentId, fromCat, toCat, surplusAvailable, deficitAvailable]);

  useEffect(() => {
    if (maxAmount != null) {
      const cur = form.getFieldValue('amount');
      if (cur == null || cur > maxAmount) form.setFieldsValue({ amount: maxAmount });
    }
  }, [maxAmount, form]);

  const handleSubmit = async (values) => {
    if (!courseId) return;
    const sid = normStudentId(values.student_id);
    const max = Math.min(
      surplusAvailable(sid, Number(values.from_category_id)),
      deficitAvailable(sid, Number(values.to_category_id))
    );
    if (values.amount > max + 0.01) {
      message.error(`El monto no puede superar ${money(max)}`);
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/surplus-allocations', {
        course_id: courseId,
        student_id: values.student_id,
        from_category_id: values.from_category_id,
        to_category_id: values.to_category_id,
        amount: values.amount,
      });
      message.success('Asignación guardada');
      form.resetFields();
      setStudentId(undefined);
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
    { title: 'Estudiante', dataIndex: 'student_label', key: 'st', width: 120, ellipsis: true },
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

  const nameByStudent = useMemo(() => {
    const m = new Map();
    (rawExpenseRows || []).forEach((e) => {
      const sid = normStudentId(e.studentID);
      if (sid && e.student_name) m.set(sid, e.student_name);
    });
    return m;
  }, [rawExpenseRows]);

  const tableData = useMemo(
    () =>
      (allocations || []).map((a) => ({
        ...a,
        student_label: nameByStudent.get(normStudentId(a.student_id)) || a.student_id,
      })),
    [allocations, nameByStudent]
  );

  return (
    <Card title="Asignación de excedentes entre categorías" bordered={false} className="surplus-panel-card">
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Mueve parte del ahorro de una categoría (origen) para cubrir el sobregasto en otra (destino). Se guarda en
        base de datos y el dashboard refleja el ajuste en las celdas (diferencia efectiva).
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
            name="student_id"
            label="Estudiante"
            rules={[{ required: true, message: 'Selecciona estudiante' }]}
            style={{ minWidth: 220 }}
          >
            <Select
              placeholder="Estudiante"
              options={studentOptions}
              showSearch
              optionFilterProp="label"
              onChange={(v) => {
                setStudentId(v);
                setFromCat(undefined);
                setToCat(undefined);
                form.setFieldsValue({ from_category_id: undefined, to_category_id: undefined, amount: undefined });
              }}
            />
          </Form.Item>
          <Form.Item
            name="from_category_id"
            label="Origen (excedente)"
            rules={[{ required: true, message: 'Origen' }]}
            style={{ minWidth: 240 }}
          >
            <Select
              placeholder="Categoría con ahorro"
              options={fromOptions}
              disabled={!studentId}
              onChange={(v) => {
                setFromCat(v);
                setToCat(undefined);
                form.setFieldsValue({ to_category_id: undefined });
              }}
            />
          </Form.Item>
          <Form.Item
            name="to_category_id"
            label="Destino (déficit)"
            rules={[{ required: true, message: 'Destino' }]}
            style={{ minWidth: 240 }}
          >
            <Select
              placeholder="Categoría con sobregasto"
              options={toOptions}
              disabled={!studentId}
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
        dataSource={tableData}
        pagination={{ pageSize: 6 }}
        locale={{ emptyText: 'Ninguna asignación aún' }}
      />
    </Card>
  );
};

export default SurplusAllocationPanel;
