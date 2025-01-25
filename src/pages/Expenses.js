import React, { useState, useEffect } from "react";
import { Table, Form, Input, InputNumber, DatePicker, Select, Upload, Button, message, Image, Card } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import api from "../services/api";
import moment from "moment";

const { Option } = Select;

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [imageFiles, setImageFiles] = useState([]); // Guardar múltiples imágenes

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
      setImageFiles((prevImages) => [...prevImages, reader.result]); // Agregar imagen a la lista
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
        images: imageFiles, // Enviar imágenes como array en Base64
      };

      await api.post("/expenses", expenseData);
      message.success("Gasto agregado correctamente.");
      form.resetFields();
      setImageFiles([]); // Limpiar imágenes
      fetchExpenses(); // Recargar la lista
    } catch (error) {
      message.error("Error al agregar el gasto.");
    }
  };

  // 📌 Definir columnas de la tabla de gastos
  const columns = [
    {
      title: "Categoría",
      dataIndex: "category_name",
      key: "category_name",
    },
    {
      title: "Monto",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => `$${amount?.toFixed(2)}`,
    },
    {
      title: "Fecha",
      dataIndex: "date",
      key: "date",
      render: (date) => moment(date).format("YYYY-MM-DD"),
    },
    {
      title: "Descripción",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Observación",
      dataIndex: "observation",
      key: "observation",
    },
    {
      title: "Imágenes",
      dataIndex: "images",
      key: "images",
      render: (images) =>
        images && images.length > 0 ? (
          images.map((img, index) => <Image key={index} width={80} src={img} style={{ marginRight: 5 }} />)
        ) : (
          "No Images"
        ),
    },
  ];

  return (
    <Card title="Gestión de Gastos" bordered={false}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
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

        <Form.Item name="observation" label="Observación">
          <Input.TextArea placeholder="Observaciones adicionales" />
        </Form.Item>

        {/* 📌 Subida de múltiples imágenes */}
        <Form.Item label="Imágenes del gasto">
          <Upload
            multiple
            showUploadList={false}
            beforeUpload={(file) => {
              handleImageChange({ file });
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>Subir Imágenes</Button>
          </Upload>

          {/* Mostrar imágenes cargadas */}
          <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
            {imageFiles.map((img, index) => (
              <div key={index} style={{ position: "relative" }}>
                <Image width={80} src={img} />
                <Button
                  type="link"
                  danger
                  size="small"
                  onClick={() => removeImage(index)}
                  style={{ position: "absolute", top: 0, right: 0 }}
                >
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

      <Table columns={columns} dataSource={expenses} rowKey="id" loading={loading} />
    </Card>
  );
};

export default Expenses;
