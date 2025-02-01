import React, { useState, useEffect } from "react";
import {
  Table,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Upload,
  Button,
  message,
  Image,
  Card,
  Popconfirm,
} from "antd";
import { UploadOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import api from "../services/api";
import moment from "moment";

const { Option } = Select;

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]); // Estado para almacenar la lista filtrada
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [imageFiles, setImageFiles] = useState([]);
  const [showForm, setShowForm] = useState(false); // Estado para mostrar/ocultar el formulario
  const [selectedCategory, setSelectedCategory] = useState(""); // Estado para el filtro de categoría

  // 📌 Cargar gastos y categorías al inicio
  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  // 📌 Obtener lista de gastos
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/expenses");
      setExpenses(response.data);
      setFilteredExpenses(response.data); // Inicialmente, mostrar todos los gastos
      setLoading(false);
    } catch (error) {
      message.error("Error al obtener los gastos.");
      setLoading(false);
    }
  };

  // 📌 Obtener lista de categorías
  const fetchCategories = async () => {
    try {
      const response = await api.get("/config/categories");
      setCategories(response.data);
    } catch (error) {
      message.error("Error al obtener las categorías.");
    }
  };

  // 📌 Manejar cambio en subida de imágenes (convertir a Base64)
  const handleImageChange = ({ file }) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageFiles((prevImages) => [...prevImages, reader.result]);
    };
    reader.readAsDataURL(file);
  };

  // 📌 Eliminar una imagen antes de enviarla
  const removeImage = (index) => {
    setImageFiles((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  // 📌 Enviar datos del formulario al backend
  const handleSubmit = async (values) => {
    try {
      const expenseData = {
        ...values,
        date: values.date.format("YYYY-MM-DD"),
        image_url: imageFiles,
      };

      await api.post("/expenses", expenseData);
      message.success("Gasto agregado correctamente.");
      form.resetFields();
      setImageFiles([]);
      fetchExpenses();
      setShowForm(false); // Ocultar formulario después de agregar
    } catch (error) {
      message.error("Error al agregar el gasto.");
    }
  };

  // 📌 Eliminar un gasto
  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      message.success("Gasto eliminado correctamente.");
      fetchExpenses();
    } catch (error) {
      message.error("Error al eliminar el gasto.");
    }
  };

  // 📌 Filtrar gastos por categoría
  const handleCategoryFilter = (value) => {
    setSelectedCategory(value);
    if (value) {
      setFilteredExpenses(expenses.filter((expense) => expense.category === value));
    } else {
      setFilteredExpenses(expenses);
    }
  };

  // 📌 Definir columnas de la tabla de gastos
  const columns = [
    { title: "Categoría", dataIndex: "category", key: "category" },
    { title: "Monto", dataIndex: "amount", key: "amount", render: (amount) => `$${amount}` },
    { title: "Fecha", dataIndex: "date", key: "date", render: (date) => moment(date).format("YYYY-MM-DD") },
    { title: "Descripción", dataIndex: "description", key: "description" },
    { title: "Observación", dataIndex: "observacion", key: "observacion" },
    {
      title: "Imágenes",
      dataIndex: "image_url",
      key: "image_url",
      render: (images) =>
        images && images.length > 0 ? (
          images.map((img, index) => <Image key={index} width={80} src={img} style={{ marginRight: 5 }} />)
        ) : (
          "No Images"
        ),
    },
    {
      title: "Acciones",
      key: "actions",
      render: (_, record) => (
        <Popconfirm title="¿Seguro que deseas eliminar este gasto?" onConfirm={() => handleDelete(record.id)}>
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card title="Gestión de Gastos" bordered={false}>
      {/* 📌 Botón para mostrar/ocultar el formulario */}
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setShowForm(!showForm)}
        style={{ marginBottom: 20 }}
      >
        {showForm ? "Cerrar Formulario" : "Agregar Gasto"}
      </Button>

      {/* 📌 Formulario de ingreso de gastos (oculto por defecto) */}
      {showForm && (
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginBottom: 20 }}>
          <Form.Item name="category_id" label="Categoría" rules={[{ required: true, message: "Selecciona una categoría" }]}>
            <Select placeholder="Seleccione una categoría">
              {categories.map((cat) => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="amount" label="Monto" rules={[{ required: true, message: "Ingrese un monto" }]}>
            <InputNumber min={0} prefix="$" style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="date" label="Fecha" rules={[{ required: true, message: "Seleccione una fecha" }]}>
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="description" label="Descripción">
            <Input.TextArea placeholder="Descripción del gasto" />
          </Form.Item>

          <Form.Item name="observacion" label="Observación">
            <Input.TextArea placeholder="Observaciones adicionales" />
          </Form.Item>

          <Form.Item label="Imágenes del gasto">
            <Upload multiple showUploadList={false} beforeUpload={(file) => handleImageChange({ file })}>
              <Button icon={<UploadOutlined />}>Subir Imágenes</Button>
            </Upload>
            <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
              {imageFiles.map((img, index) => (
                <div key={index} style={{ position: "relative" }}>
                  <Image width={80} src={img} />
                  <Button type="link" danger size="small" onClick={() => removeImage(index)} style={{ position: "absolute", top: 0, right: 0 }}>
                    X
                  </Button>
                </div>
              ))}
            </div>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Agregar Gasto
            </Button>
          </Form.Item>
        </Form>
      )}

      {/* 📌 Filtro por categoría */}
      <Select placeholder="Filtrar por categoría" onChange={handleCategoryFilter} allowClear style={{ width: 200, marginBottom: 20 }}>
        {categories.map((cat) => (
          <Option key={cat.id} value={cat.name}>
            {cat.name}
          </Option>
        ))}
      </Select>

      {/* 📌 Tabla de gastos filtrados */}
      <Table columns={columns} dataSource={filteredExpenses} rowKey="id" loading={loading} />
    </Card>
  );
};

export default Expenses;
