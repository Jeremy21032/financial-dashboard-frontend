import React, { useEffect, useState } from "react";
import { Table, Button, Form, Input, Popconfirm, message, Card, InputNumber } from "antd";
import api from "../services/api";

const Configurations = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchCategories();
  }, []);

  // 📌 Obtener categorías desde la API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get("/config/categories");
      setCategories(response.data);
      setLoading(false);
    } catch (error) {
      message.error("Error al obtener categorías.");
      setLoading(false);
    }
  };

  // 📌 Agregar una nueva categoría
  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      const response = await api.post("/config/categories", { name: values.name, description:values.description, observation:values.observations, base_amount:values.base_amount });
      setCategories([...categories, { id: response.data.id, name: values.name }]);
      form.resetFields();
      message.success("Categoría agregada correctamente.");
    } catch (error) {
      message.error("Error al agregar la categoría.");
    }
  };

  // 📌 Iniciar edición
  const edit = (record) => {
    form.setFieldsValue({ name: record.name });
    setEditingKey(record.id);
  };

  // 📌 Guardar cambios en una categoría editada
  const handleSave = async (id) => {
    try {
      const values = await form.validateFields();
      await api.put(`/config/categories/${id}`, { name: values.name });

      setCategories(categories.map((cat) => (cat.id === id ? { ...cat, name: values.name } : cat)));
      setEditingKey(null);
      message.success("Categoría actualizada correctamente.");
    } catch (error) {
      message.error("Error al actualizar la categoría.");
    }
  };

  // 📌 Cancelar edición
  const cancelEdit = () => {
    setEditingKey(null);
    form.resetFields();
  };

  // 📌 Eliminar una categoría
  const handleDelete = async (id) => {
    try {
      await api.delete(`/config/categories/${id}`);
      setCategories(categories.filter((cat) => cat.id !== id));
      message.success("Categoría eliminada correctamente.");
    } catch (error) {
      message.error("Error al eliminar la categoría.");
    }
  };

  // 📌 Definir columnas de la tabla
  const columns = [
    {
      title: "Nombre de Categoría",
      dataIndex: "name",
      key: "name",
      render: (_, record) =>
        editingKey === record.id ? (
          <Form.Item name="name" rules={[{ required: true, message: "Ingrese el nombre" }]}>
            <Input />
          </Form.Item>
        ) : (
          record.name
        ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => {
        const editable = editingKey === record.id;
        return editable ? (
          <>
            <Button type="link" onClick={() => handleSave(record.id)}>
              Guardar
            </Button>
            <Button type="link" onClick={cancelEdit}>
              Cancelar
            </Button>
          </>
        ) : (
          <>
            <Button type="link" onClick={() => edit(record)}>Editar</Button>
            <Popconfirm title="¿Eliminar esta categoría?" onConfirm={() => handleDelete(record.id)}>
              <Button danger>Eliminar</Button>
            </Popconfirm>
          </>
        );
      },
    },
  ];

  return (
    <Card title="Gestión de Categorías" bordered={false}>
      <Form form={form} layout="inline" style={{ marginBottom: 20 }}>
        <Form.Item name="name" rules={[{ required: true, message: "Ingrese un nombre de categoría" }]}>
          <Input placeholder="Nombre de la categoría" />
        </Form.Item>
        <Form.Item name="base_amount" rules={[{ required: true, message: "Ingrese un monto" }]}>
          <InputNumber placeholder="Monto base" />
        </Form.Item>
        <Form.Item name="description" rules={[{ required: true, message: "Ingrese una descripción de categoría" }]}>
          <Input placeholder="Decripción de la categoría" />
        </Form.Item>
        <Form.Item name="observation" rules={[{ required: true, message: "Ingrese una observación" }]}>
          <Input placeholder="Observaciones adicionales" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" onClick={()=>handleAdd()}>
            Agregar Categoría
          </Button>
        </Form.Item>
      </Form>

      <Form form={form} component={false}>
        <Table
          rowClassName={() => "editable-row"}
          bordered
          dataSource={categories}
          columns={columns}
          rowKey="id"
          loading={loading}
        />
      </Form>
    </Card>
  );
};

export default Configurations;
