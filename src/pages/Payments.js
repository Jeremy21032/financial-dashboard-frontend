import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  message,
  Card,
  Space,
  Row,
  Col,
  Popconfirm,
  Image,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import { useCourse } from '../context/CourseContext';
import api, { addCourseIdToQuery, addCourseId, getPaymentImageUrl } from '../services/api';
import ImageUploader from '../components/ImageUploader';
import { runReceiptOcr } from '../utils/paymentReceiptOcr';
import { matchStudent } from '../utils/paymentReceiptParse';
import moment from 'moment';
import './Payments.css';

const { Option } = Select;

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  const { selectedCourseId } = useCourse();
  const [form] = Form.useForm();
  const paymentImage = Form.useWatch('payment_image', form);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrHint, setOcrHint] = useState(null);

  const fetchStudents = useCallback(async () => {
    try {
      const url = addCourseIdToQuery('/students', selectedCourseId);
      const response = await api.get(url);
      setStudents(response.data);
    } catch (error) {
      message.error('Error al cargar estudiantes');
      console.error(error);
    }
  }, [selectedCourseId]);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const url = addCourseIdToQuery('/payments', selectedCourseId);
      const response = await api.get(url);
      setPayments(response.data);
      setFilteredPayments(response.data);
    } catch (error) {
      message.error('Error al cargar pagos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchStudents();
      fetchPayments();
    }
  }, [selectedCourseId, fetchStudents, fetchPayments]);

  const handleSubmit = async (values) => {
    try {
      const paymentData = addCourseId({
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        amount: parseFloat(values.amount)
      }, selectedCourseId);

      if (editingPayment) {
        await api.put(`/payments/${editingPayment.id}`, paymentData);
        message.success('Pago actualizado correctamente');
      } else {
        await api.post('/payments', paymentData);
        message.success('Pago registrado correctamente');
      }

      form.resetFields();
      setShowForm(false);
      setEditingPayment(null);
      setOcrHint(null);
      fetchPayments();
    } catch (error) {
      message.error('Error al procesar el pago');
      console.error(error);
    }
  };

  const handleExtractFromReceipt = async () => {
    const img = form.getFieldValue('payment_image');
    if (!img || typeof img !== 'string') {
      message.warning('Sube primero una imagen del comprobante (JPG o PNG).');
      return;
    }
    setOcrLoading(true);
    setOcrHint(null);
    try {
      const result = await runReceiptOcr(img);
      const textForMatch = [result.rawText, result.beneficiarySnippet].filter(Boolean).join('\n');
      const match = matchStudent(students, textForMatch);

      const updates = {};
      if (result.amount != null) updates.amount = result.amount;
      if (result.dateStr) updates.date = moment(result.dateStr, 'YYYY-MM-DD');
      if (match.studentId != null && !match.ambiguous) {
        updates.student_id = match.studentId;
      }
      form.setFieldsValue(updates);

      setOcrHint({
        amount: result.amount,
        dateStr: result.dateStr,
        comprobante: result.comprobante,
        beneficiarySnippet: result.beneficiarySnippet || '',
        studentMatched: Boolean(match.studentId && !match.ambiguous),
        studentAmbiguous: match.ambiguous,
        studentUnmatched: !match.studentId && !match.ambiguous,
      });

      message.success('Datos sugeridos aplicados. Revisa el formulario y confirma con Registrar.');
    } catch (e) {
      console.error(e);
      message.error('No se pudo leer el comprobante. Prueba otra imagen más nítida.');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    form.setFieldsValue({
      student_id: payment.student_id,
      amount: payment.amount,
      date: moment(payment.date),
      payment_period: payment.payment_period,
      payment_status: payment.payment_status,
      payment_image: payment.payment_image
    });
    setShowForm(true);
    setOcrHint(null);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/payments/${id}`);
      message.success('Pago eliminado correctamente');
      fetchPayments();
    } catch (error) {
      message.error('Error al eliminar el pago');
      console.error(error);
    }
  };

  const handleFilter = () => {
    let filtered = payments;

    if (searchText) {
      filtered = filtered.filter(payment => {
        const student = students.find(s => s.id === payment.student_id);
        return student && student.name.toLowerCase().includes(searchText.toLowerCase());
      });
    }

    if (selectedPeriod) {
      filtered = filtered.filter(payment => payment.payment_period === selectedPeriod);
    }

    if (selectedStatus) {
      filtered = filtered.filter(payment => payment.payment_status === selectedStatus);
    }

    setFilteredPayments(filtered);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedPeriod('');
    setSelectedStatus('');
    setFilteredPayments(payments);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Estudiante',
      key: 'student',
      render: (_, record) => {
        const student = students.find(s => s.id === record.student_id);
        return student ? student.name : 'N/A';
      },
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount ? parseFloat(amount).toFixed(2) : '0.00'}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('DD/MM/YYYY'),
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
    },
    {
      title: 'Período',
      dataIndex: 'payment_period',
      key: 'payment_period',
      render: (period) => period === 'first' ? 'Primer Período' : 'Segundo Período',
    },
    {
      title: 'Estado',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status) => (
        <span className={`status-badge status-${status.toLowerCase().replace(/\s+/g, '-')}`}>
          {status}
        </span>
      ),
    },
    {
      title: 'Comprobante',
      dataIndex: 'payment_image',
      key: 'payment_image',
      render: (image) => {
        const src = getPaymentImageUrl(image);
        return src ? (
          <Image
            src={src}
            alt="Comprobante"
            width={50}
            height={50}
            style={{ objectFit: 'cover', borderRadius: 4 }}
            preview={{
              mask: <EyeOutlined />
            }}
          />
        ) : (
          <span style={{ color: '#999' }}>Sin imagen</span>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="¿Eliminar este pago?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="payments-container">
      <Card title="Gestión de Pagos" className="payments-card">
        {/* Header con botón para agregar */}
        <Row justify="space-between" align="middle" className="payments-header">
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setShowForm(true);
                setEditingPayment(null);
                setOcrHint(null);
                form.resetFields();
              }}
            >
              Nuevo Pago
            </Button>
          </Col>
        </Row>

        {/* Filtros */}
        <Card size="small" className="filters-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Buscar por estudiante"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Período"
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="first">Primer Período</Option>
                <Option value="second">Segundo Período</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select
                placeholder="Estado"
                value={selectedStatus}
                onChange={setSelectedStatus}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="Registrado">Registrado</Option>
                <Option value="Acreditado">Acreditado</Option>
                <Option value="Registrado/Sin acreditar">Sin acreditar</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={10}>
              <Space>
                <Button type="primary" onClick={handleFilter}>
                  Filtrar
                </Button>
                <Button onClick={clearFilters}>
                  Limpiar
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Formulario */}
        {showForm && (
          <Card size="small" className="form-card">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Row gutter={16}>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="student_id"
                    label="Estudiante"
                    rules={[{ required: true, message: 'Selecciona un estudiante' }]}
                  >
                    <Select
                      placeholder="Seleccionar estudiante"
                      showSearch
                      optionFilterProp="children"
                      filterOption={(input, option) =>
                        option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                      }
                    >
                      {students.map(student => (
                        <Option key={student.id} value={student.id}>
                          {student.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="amount"
                    label="Monto"
                    rules={[{ required: true, message: 'Ingresa el monto' }]}
                  >
                    <InputNumber
                      prefix="$"
                      style={{ width: '100%' }}
                      min={0}
                      step={0.01}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="date"
                    label="Fecha"
                    rules={[{ required: true, message: 'Selecciona una fecha' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="payment_period"
                    label="Período"
                    rules={[{ required: true, message: 'Selecciona un período' }]}
                  >
                    <Select>
                      <Option value="first">Primer Período</Option>
                      <Option value="second">Segundo Período</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item
                    name="payment_status"
                    label="Estado"
                    rules={[{ required: true, message: 'Selecciona un estado' }]}
                  >
                    <Select>
                      <Option value="Registrado">Registrado</Option>
                      <Option value="Acreditado">Acreditado</Option>
                      <Option value="Registrado/Sin acreditar">Sin acreditar</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Form.Item name="payment_image" label="Comprobante">
                    <ImageUploader
                      onUpload={(image) => {
                        form.setFieldsValue({ payment_image: image });
                        setOcrHint(null);
                      }}
                    />
                  </Form.Item>
                  <Button
                    type="default"
                    icon={<FileSearchOutlined />}
                    loading={ocrLoading}
                    disabled={!paymentImage}
                    onClick={handleExtractFromReceipt}
                    block
                  >
                    Extraer datos del comprobante
                  </Button>
                </Col>
              </Row>
              {ocrHint && (
                <Row style={{ marginTop: 12 }}>
                  <Col span={24}>
                    <Alert
                      type="info"
                      showIcon
                      closable
                      onClose={() => setOcrHint(null)}
                      message="Valores detectados (revisar antes de registrar)"
                      description={
                        <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                          {ocrHint.amount != null && (
                            <li>Monto sugerido: ${Number(ocrHint.amount).toFixed(2)}</li>
                          )}
                          {ocrHint.dateStr && <li>Fecha sugerida: {ocrHint.dateStr}</li>}
                          {ocrHint.comprobante && (
                            <li>Comprobante (referencia): {ocrHint.comprobante}</li>
                          )}
                          {ocrHint.beneficiarySnippet && (
                            <li>Texto beneficiario / contexto: {ocrHint.beneficiarySnippet}</li>
                          )}
                          {ocrHint.studentMatched && <li>Estudiante: coincidencia aplicada</li>}
                          {ocrHint.studentAmbiguous && (
                            <li>
                              Estudiante: varias coincidencias posibles — elige manualmente en el
                              desplegable.
                            </li>
                          )}
                          {ocrHint.studentUnmatched && (
                            <li>Estudiante: no se pudo inferir con seguridad — selección manual.</li>
                          )}
                        </ul>
                      }
                    />
                  </Col>
                </Row>
              )}
              <Row>
                <Col>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      {editingPayment ? 'Actualizar' : 'Registrar'}
                    </Button>
                    <Button onClick={() => {
                      setShowForm(false);
                      setEditingPayment(null);
                      setOcrHint(null);
                      form.resetFields();
                    }}>
                      Cancelar
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Form>
          </Card>
        )}

        {/* Tabla */}
        <Table
          columns={columns}
          dataSource={filteredPayments}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} pagos`,
          }}
          scroll={{ x: 800 }}
          className="payments-table"
        />
      </Card>
    </div>
  );
};

export default Payments;