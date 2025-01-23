import React, { useState, useRef } from "react";
import {
  Table,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Image,
  Button,
  DatePicker,
  Upload,
  Tag,
  message,
  Typography,
  Space
} from "antd";
import { UploadOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import api from "../services/api";
import moment from "moment";

// Componente de celda editable
const EditableCell = ({ editing, dataIndex, title, inputType, record, children, ...restProps }) => {
  let inputNode;

  if (dataIndex === "amount") {
    inputNode = <InputNumber min={0} />;
  } else if (dataIndex === "payment_status") {
    inputNode = (
      <Select
        options={[
          { value: "Registrado", label: "Registrado" },
          { value: "Acreditado", label: "Acreditado" },
          { value: "Registrado/Sin acreditar", label: "Registrado/Sin acreditar" },
        ]}
      />
    );
  } else if (dataIndex === "payment_period") {
    inputNode = (
      <Select
        options={[
          { value: "first", label: "First Period" },
          { value: "second", label: "Second Period" },
        ]}
      />
    );
  } else if (dataIndex === "date") {
    inputNode = <DatePicker format="YYYY-MM-DD" />;
  } else {
    inputNode = <Input />;
  }

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[{ required: true, message: `Por favor ingresa ${title}!` }]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const PaymentsTable = ({ payments, setPayments }) => {
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

  // Verifica si un registro está en modo edición
  const isEditing = (record) => record.id === editingId;

  // Habilitar edición
  const edit = (record) => {
    form.setFieldsValue({
      amount: record.amount || 0,
      date: record.date ? moment(record.date, "YYYY-MM-DD") : null,
      payment_period: record.payment_period || "first",
      payment_status: record.payment_status || "Registrado",
    });
    setImageFile(record.payment_image || null);
    setEditingId(record.id);
  };

  // Cancelar edición
  const cancel = () => {
    setEditingId("");
    setImageFile(null);
  };

  // Guardar cambios en el backend y en la tabla
  const save = async (id) => {
    try {
      await form.validateFields();
      const row = form.getFieldsValue();
      const item = payments.find((payment) => payment.id === id);

      if (!item) {
        message.error("ID no encontrado para la actualización");
        return;
      }

      const updatedAmount = parseFloat(row.amount);
      if (isNaN(updatedAmount)) {
        message.error("El monto ingresado no es válido.");
        return;
      }

      const updatedRow = {
        ...row,
        amount: updatedAmount,
        date: row.date ? row.date.format("YYYY-MM-DD") : "",
        payment_image: imageFile || item.payment_image,
        id: item.id,
      };

      await api.put(`/payments/${item.id}`, updatedRow);

      const newData = payments.map((payment) =>
        payment.id === id ? { ...payment, ...updatedRow } : payment
      );

      setPayments(newData);
      setEditingId("");
      setImageFile(null);
      message.success("Pago actualizado con éxito");
    } catch (errInfo) {
      message.error("Error al actualizar el pago");
    }
  };

  // Eliminar un pago
  const deletePayment = async (id) => {
    try {
      await api.delete(`/payments/${id}`);
      setPayments(payments.filter((payment) => payment.id !== id));
      message.success("Pago eliminado con éxito");
    } catch (error) {
      message.error("Error al eliminar el pago");
    }
  };

  // Configuración de búsqueda por Student ID
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Buscar ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small">
            Buscar
          </Button>
          <Button onClick={() => clearFilters && clearFilters()} size="small">
            Reset
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />,
    onFilter: (value, record) => record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
  });

  // Definición de las columnas de la tabla
  const columns = [
    { title: "Payment ID", dataIndex: "id", key: "id" },
    { title: "Student ID", dataIndex: "student_id", key: "student_id", ...getColumnSearchProps("student_id") },
    { title: "Amount", dataIndex: "amount", key: "amount", editable: true },
    { title: "Date", dataIndex: "date", key: "date", editable: true },
    {
      title: "Payment Status",
      dataIndex: "payment_status",
      key: "payment_status",
      editable: true,
      render: (status) => {
        let color;
        switch (status) {
          case "Registrado":
            color = "blue";
            break;
          case "Acreditado":
            color = "green";
            break;
          case "Registrado/Sin acreditar":
            color = "orange";
            break;
          default:
            color = "gray";
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Receipt",
      dataIndex: "payment_image",
      key: "payment_image",
      render: (_, record) => <Image width={100} src={record.payment_image} />,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} onClick={() => edit(record)} disabled={editingId !== ""}>
            Edit
          </Button>
          <Popconfirm title="¿Eliminar este pago?" onConfirm={() => deletePayment(record.id)}>
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return <Form form={form} component={false}><Table components={{ body: { cell: EditableCell } }} bordered dataSource={payments} columns={columns} rowKey="id" /></Form>;
};

export default PaymentsTable;
