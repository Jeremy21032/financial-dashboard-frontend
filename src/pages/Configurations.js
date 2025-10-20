import React, { useState, useEffect } from 'react';
import {
  Table,
  Form,
  Input,
  InputNumber,
  Button,
  message,
  Card,
  Space,
  Row,
  Col,
  Popconfirm,
  Modal
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useCourse } from '../context/CourseContext';
import api, { addCourseIdToQuery, addCourseId } from '../services/api';
import './Configurations.css';

const Configurations = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  const { selectedCourseId } = useCourse();
  const [form] = Form.useForm();

  useEffect(() => {
    if (selectedCourseId) {
      fetchCategories();
    }
  }, [selectedCourseId]);

  const fetchCategories = async () => {
    try {
      setLoading(true);

      if (!selectedCourseId) {
        setCategories([]);
        return;
      }

      const url = addCourseIdToQuery('/config/categories', selectedCourseId);
      const response = await api.get(url);
      setCategories(response.data);
    } catch (error) {
      message.error('Error al cargar categorías');
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const categoryData = addCourseId(values, selectedCourseId);
      
      if (editingCategory) {
        await api.put(`/config/categories/${editingCategory.id}`, categoryData);
        message.success('Categoría actualizada correctamente');
      } else {
        await api.post('/config/categories', categoryData);
        message.success('Categoría creada correctamente');
      }

      form.resetFields();
      setShowForm(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      message.error('Error al procesar la categoría');
      console.error(error);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      base_amount: category.base_amount
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/config/categories/${id}`);
      message.success('Categoría eliminada correctamente');
      fetchCategories();
    } catch (error) {
      message.error('Error al eliminar la categoría');
      console.error(error);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Monto Base',
      dataIndex: 'base_amount',
      key: 'base_amount',
      render: (amount) => amount ? `$${parseFloat(amount).toFixed(2)}` : '$0.00',
      sorter: (a, b) => (a.base_amount || 0) - (b.base_amount || 0),
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
          >
            Editar
          </Button>
          <Popconfirm
            title="¿Eliminar esta categoría?"
            description="Esta acción no se puede deshacer"
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

  if (!selectedCourseId) {
    return (
      <div className="configurations-container">
        <Card title="Configuraciones del Sistema" className="configurations-card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>Selecciona un curso</h3>
            <p>Para gestionar las categorías, primero debes seleccionar un curso en el selector superior.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="configurations-container">
      <Card title="Configuraciones del Sistema" className="configurations-card">
        <div className="config-section">
          <Row justify="space-between" align="middle" className="section-header">
            <Col>
              <h3>
                <SettingOutlined style={{ marginRight: 8 }} />
                Gestión de Categorías
              </h3>
              <p>Administra las categorías disponibles para los gastos del curso seleccionado</p>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setShowForm(true);
                  setEditingCategory(null);
                  form.resetFields();
                }}
              >
                Nueva Categoría
              </Button>
            </Col>
          </Row>

          {/* Formulario */}
          {showForm && (
            <Card size="small" className="form-card">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="name"
                      label="Nombre de la Categoría"
                      rules={[
                        { required: true, message: 'Ingresa el nombre de la categoría' },
                        { min: 2, message: 'El nombre debe tener al menos 2 caracteres' }
                      ]}
                    >
                      <Input placeholder="Ej: Materiales, Transporte, etc." />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="description"
                      label="Descripción"
                      rules={[
                        { required: true, message: 'Ingresa una descripción' },
                        { min: 5, message: 'La descripción debe tener al menos 5 caracteres' }
                      ]}
                    >
                      <Input placeholder="Descripción detallada de la categoría" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="base_amount"
                      label="Monto Base (opcional)"
                    >
                      <InputNumber
                        prefix="$"
                        style={{ width: '100%' }}
                        min={0}
                        step={0.01}
                        placeholder="Monto base de la categoría"
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Space>
                      <Button type="primary" htmlType="submit">
                        {editingCategory ? 'Actualizar' : 'Crear'}
                      </Button>
                      <Button onClick={() => {
                        setShowForm(false);
                        setEditingCategory(null);
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
            dataSource={categories}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} de ${total} categorías`,
            }}
            className="categories-table"
          />
        </div>

        {/* Información adicional */}
        <Card size="small" className="info-card">
          <h4>Información del Sistema</h4>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <div className="info-item">
                <strong>Total de Categorías:</strong> {categories.length}
              </div>
            </Col>
            <Col xs={24} sm={12}>
              <div className="info-item">
                <strong>Última Actualización:</strong> {new Date().toLocaleString()}
              </div>
            </Col>
          </Row>
        </Card>
      </Card>
    </div>
  );
};

export default Configurations;