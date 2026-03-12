import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Upload
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  EyeOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useCourse } from '../context/CourseContext';
import api, { addCourseIdToQuery, addCourseId } from '../services/api';
import moment from 'moment';
import './Expenses.css';

const { Option } = Select;
const { TextArea } = Input;

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const uploadContainerRef = useRef(null);
  
  const { selectedCourseId } = useCourse();
  const [form] = Form.useForm();

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const url = addCourseIdToQuery('/expenses', selectedCourseId);
      const response = await api.get(url);
      setExpenses(response.data);
      setFilteredExpenses(response.data);
    } catch (error) {
      message.error('Error al cargar gastos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  const fetchCategories = useCallback(async () => {
    try {
      if (!selectedCourseId) {
        setCategories([]);
        return;
      }

      const url = addCourseIdToQuery('/config/categories', selectedCourseId);
      const response = await api.get(url);
      setCategories(response.data);
    } catch (error) {
      message.error('Error al cargar categorías');
      console.error('❌ [Expenses] Error:', error);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchExpenses();
      fetchCategories();
    }
  }, [selectedCourseId, fetchExpenses, fetchCategories]);

  const validateFile = useCallback((file) => {
    if (!file || !(file instanceof Blob)) {
      message.error('Archivo no válido');
      return false;
    }

    const isImage = file.type?.startsWith('image/');
    if (!isImage) {
      message.error('Solo puedes subir archivos de imagen');
      return false;
    }

    const isLt3M = file.size / 1024 / 1024 < 3;
    if (!isLt3M) {
      message.error('La imagen debe ser menor a 3MB');
      return false;
    }

    return true;
  }, []);

  const convertToJpegBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const imgElement = new window.Image();
        imgElement.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = imgElement.width;
            canvas.height = imgElement.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(imgElement, 0, 0);
            const jpegData = canvas.toDataURL('image/jpeg', 0.92);
            resolve(jpegData);
          } catch (error) {
            reject(error);
          }
        };
        imgElement.onerror = (err) => reject(err);
        imgElement.src = reader.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }, []);

  const processFile = useCallback(async (file) => {
    if (!file || !validateFile(file)) return;

    try {
      const jpegBase64 = await convertToJpegBase64(file);
      setImageFiles((prev) => [...prev, jpegBase64]);
    } catch (error) {
      console.error('Error convirtiendo la imagen a JPEG:', error);
      message.error('No se pudo procesar la imagen. Intenta con otro archivo.');
    }
  }, [convertToJpegBase64, validateFile]);

  const handleImageChange = useCallback((info) => {
    const file = info?.file?.originFileObj || info?.file || info;

    if (!file) {
      console.warn('Archivo no válido en handleImageChange:', info);
      return;
    }

    processFile(file);
  }, [processFile]);

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handlePaste = useCallback((event) => {
    const items = event.clipboardData?.items;
    if (!items || !items.length) {
      message.warning('No se encontró ninguna imagen en el portapapeles');
      return;
    }

    const imageItems = Array.from(items).filter((item) =>
      item.type && item.type.startsWith('image/')
    );

    if (!imageItems.length) {
      message.warning('No se encontró ninguna imagen en el portapapeles');
      return;
    }

    event.preventDefault();

    imageItems.forEach((item) => {
      const file = item.getAsFile();
      if (file) {
        processFile(file);
      }
    });

    message.success('Imagen pegada desde el portapapeles');
  }, [processFile]);

  const handleSubmit = async (values) => {
    try {
      const expenseData = addCourseId({
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        image_url: imageFiles,
      }, selectedCourseId);

      if (editingExpense) {
        await api.put(`/expenses/${editingExpense.id}`, expenseData);
        message.success('Gasto actualizado correctamente');
      } else {
        await api.post('/expenses', expenseData);
        message.success('Gasto registrado correctamente');
      }

      form.resetFields();
      setImageFiles([]);
      setShowForm(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      message.error('Error al procesar el gasto');
      console.error(error);
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    form.setFieldsValue({
      category_id: expense.category_id,
      amount: expense.amount,
      date: moment(expense.date),
      description: expense.description,
      observacion: expense.observacion
    });
    setImageFiles(expense.image_url || []);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      message.success('Gasto eliminado correctamente');
      fetchExpenses();
    } catch (error) {
      message.error('Error al eliminar el gasto');
      console.error(error);
    }
  };

  const handleFilter = () => {
    let filtered = expenses;

    if (searchText) {
      filtered = filtered.filter(expense =>
        expense.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        expense.observacion?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    setFilteredExpenses(filtered);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedCategory('');
    setFilteredExpenses(expenses);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Categoría',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <span className="category-badge">{category}</span>
      ),
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
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Observación',
      dataIndex: 'observacion',
      key: 'observacion',
      ellipsis: true,
    },
    {
      title: 'Imágenes',
      dataIndex: 'image_url',
      key: 'image_url',
      render: (images) => (
        <div className="image-gallery">
          {images && images.length > 0 ? (
            images.slice(0, 3).map((img, index) => (
              <Image
                key={index}
                src={img}
                alt={`Imagen ${index + 1}`}
                width={40}
                height={40}
                style={{ objectFit: 'cover', borderRadius: 4, marginRight: 4 }}
                preview={{
                  mask: <EyeOutlined />
                }}
              />
            ))
          ) : (
            <span style={{ color: '#999' }}>Sin imágenes</span>
          )}
          {images && images.length > 3 && (
            <span style={{ color: '#666', fontSize: '12px' }}>
              +{images.length - 3}
            </span>
          )}
        </div>
      ),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => handleEdit(record)}
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar este gasto?"
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
    <div className="expenses-container">
      <Card title="Gestión de Gastos" className="expenses-card">
        {/* Header con botón para agregar */}
        <Row justify="space-between" align="middle" className="expenses-header">
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setShowForm(true);
                setEditingExpense(null);
                form.resetFields();
                setImageFiles([]);
              }}
            >
              Nuevo Gasto
            </Button>
          </Col>
        </Row>

        {/* Filtros */}
        <Card size="small" className="filters-card">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Buscar por descripción"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Filtrar por categoría"
                value={selectedCategory}
                onChange={setSelectedCategory}
                allowClear
                style={{ width: '100%' }}
              >
                {categories.map(category => (
                  <Option key={category.id} value={category.name}>
                    {category.name}
                  </Option>
                ))}
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
                    name="category_id"
                    label="Categoría"
                    rules={[{ required: true, message: 'Selecciona una categoría' }]}
                  >
                    <Select placeholder="Seleccionar categoría">
                      {categories.map(category => (
                        <Option key={category.id} value={category.id}>
                          {category.name}
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
                <Col xs={24}>
                  <Form.Item
                    name="description"
                    label="Descripción"
                    rules={[{ required: true, message: 'Ingresa una descripción' }]}
                  >
                    <TextArea
                      placeholder="Descripción del gasto"
                      rows={3}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item
                    name="observacion"
                    label="Observación"
                  >
                    <TextArea
                      placeholder="Observaciones adicionales"
                      rows={2}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label="Imágenes del gasto">
                    <div
                      ref={uploadContainerRef}
                      onPaste={handlePaste}
                      tabIndex={0}
                      onClick={() => uploadContainerRef.current?.focus()}
                      className="image-uploader-container"
                    >
                      <Upload
                        multiple
                        showUploadList={false}
                        beforeUpload={(file) => {
                          if (!validateFile(file)) {
                            return Upload.LIST_IGNORE;
                          }
                          processFile(file);
                          return Upload.LIST_IGNORE;
                        }}
                        accept="image/*"
                      >
                        <Button icon={<UploadOutlined />}>
                          Subir Imágenes
                        </Button>
                      </Upload>
                      <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                        También puedes pegar imágenes copiadas (Ctrl/Cmd + V).
                      </div>
                    </div>
                    <div className="image-preview-container">
                      {imageFiles.map((img, index) => (
                        <div key={index} className="image-preview-item">
                          <Image
                            src={img}
                            alt={`Preview ${index + 1}`}
                            width={80}
                            height={80}
                            style={{ objectFit: 'cover', borderRadius: 4 }}
                          />
                          <Button
                            type="text"
                            danger
                            size="small"
                            onClick={() => removeImage(index)}
                            className="remove-image-btn"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Space>
                    <Button type="primary" htmlType="submit">
                      {editingExpense ? 'Actualizar' : 'Registrar'}
                    </Button>
                    <Button onClick={() => {
                      setShowForm(false);
                      setEditingExpense(null);
                      form.resetFields();
                      setImageFiles([]);
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
          dataSource={filteredExpenses}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} de ${total} gastos`,
          }}
          scroll={{ x: 1000 }}
          className="expenses-table"
        />
      </Card>
    </div>
  );
};

export default Expenses;
