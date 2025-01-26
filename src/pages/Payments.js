import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Button, DatePicker, Form, Input, Select } from "antd";
import { fetchPayments, fetchStudents } from "../utils/dbUtils";
import ImageUploader from "../components/ImageUploader";
import PaymentsTable from "../components/PaymentsTable";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]); // Lista filtrada de pagos
  const [searchLastName, setSearchLastName] = useState(""); // Filtro por apellido
  const [searchPaymentID, setSearchPaymentID] = useState(""); // Filtro por ID de pago

  const [newPayment, setNewPayment] = useState({
    student_id: "",
    amount: "",
    date: "",
    payment_period: "first",
    payment_image: "",
    payment_status: "Registrado",
  });

  const [form] = Form.useForm();

  useEffect(() => {
    fetchStudents((data) => {
      const formattedStudents = data.map((student) => ({
        value: student.id,
        label: student.name,
      }));
      setStudents(formattedStudents);
    });

    fetchPayments((data) => {
      setPayments(data);
      setFilteredPayments(data);
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewPayment({
      ...newPayment,
      [name]: name === "amount" ? parseFloat(value) || "" : value,
    });
  };

  const handleSelectChange = (value, field) => {
    setNewPayment({ ...newPayment, [field]: value });
  };

  const handleDateChange = (date, dateString) => {
    setNewPayment({ ...newPayment, date: dateString });
  };

  const handleImageUpload = (base64Image) => {
    setNewPayment({ ...newPayment, payment_image: base64Image });
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();

    if (!newPayment.student_id || !newPayment.amount || !newPayment.date) {
      alert("Por favor, completa todos los campos.");
      return;
    }

    try {
      await api.post("/payments", {
        ...newPayment,
        amount: parseFloat(newPayment.amount),
      });

      fetchPayments((data) => {
        setPayments(data);
        setFilteredPayments(data);
      });

      setNewPayment({
        student_id: "",
        amount: "",
        date: "",
        payment_period: "first",
        payment_image: "",
        payment_status: "Registrado",
      });

      form.resetFields();
      alert("Pago registrado con éxito.");
    } catch (error) {
      console.error("Error adding payment:", error);
      alert("Hubo un error al registrar el pago.");
    }
  };

  // 🔹 Filtrar pagos por apellido del estudiante o ID de pago
  const handleFilterPayments = () => {
    let filtered = payments;

    if (searchLastName) {
      const student = students.find((s) => {
        const firstLastName = s.label.split(" ")[0]; // Obtener solo el primer apellido
        return firstLastName.toLowerCase() === searchLastName.toLowerCase();
      });

      if (student) {
        filtered = filtered.filter((payment) => payment.student_id === student.value);
      } else {
        filtered = [];
      }
    }

    if (searchPaymentID) {
      filtered = filtered.filter((payment) => payment.id.toString() === searchPaymentID);
    }

    setFilteredPayments(filtered);
  };

  // 🔹 Extraer solo los primeros apellidos únicos para el filtro
  const uniqueLastNames = Array.from(
    new Set(students.map((s) => s.label.split(" ")[0].toLowerCase()))
  ).map((lastName) => ({
    value: lastName,
    label: lastName.charAt(0).toUpperCase() + lastName.slice(1),
  }));

  return (
    <div>
      <h2>Register a Payment</h2>
      <Form
        layout="inline"
        form={form}
        style={{
          maxWidth: "none",
          marginBottom: "20px",
        }}
      >
        <Form.Item label="Student">
          <Select
            showSearch
            placeholder="Select a student"
            optionFilterProp="label"
            options={students}
            onChange={(value) => handleSelectChange(value, "student_id")}
          />
        </Form.Item>
        <Form.Item label="Date">
          <DatePicker onChange={handleDateChange} />
        </Form.Item>
        <Form.Item label="Amount">
          <Input
            name="amount"
            placeholder="Enter amount"
            value={newPayment.amount}
            onChange={handleInputChange}
            type="number"
          />
        </Form.Item>
        <Form.Item label="Payment Period">
          <Select
            value={newPayment.payment_period}
            onChange={(value) => handleSelectChange(value, "payment_period")}
            options={[
              { value: "first", label: "First Period" },
              { value: "second", label: "Second Period" },
            ]}
          />
        </Form.Item>
        <Form.Item label="Payment Status">
          <Select
            value={newPayment.payment_status}
            onChange={(value) => handleSelectChange(value, "payment_status")}
            options={[
              { value: "Registrado", label: "Registrado" },
              { value: "Acreditado", label: "Acreditado" },
              { value: "Registrado/Sin acreditar", label: "Registrado/Sin acreditar" },
            ]}
          />
        </Form.Item>
        <Form.Item label="Upload Receipt">
          <ImageUploader onUpload={handleImageUpload} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleAddPayment}>
            Submit
          </Button>
        </Form.Item>
      </Form>

      {/* 🔹 Filtros */}
      <h3>Filtrar Pagos</h3>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <Select
          showSearch
          placeholder="Filtrar por Apellido"
          optionFilterProp="label"
          options={uniqueLastNames}
          onChange={(value) => setSearchLastName(value)}
          allowClear
          style={{ width: 200 }}
        />
        <Input
          placeholder="Filtrar por ID de Pago"
          value={searchPaymentID}
          onChange={(e) => setSearchPaymentID(e.target.value)}
          style={{ width: 200 }}
        />
        <Button type="primary" onClick={handleFilterPayments}>
          Aplicar Filtros
        </Button>
      </div>

      {/* 🔹 Tabla de Pagos Filtrada */}
      <h2>Payments List</h2>
      <PaymentsTable payments={filteredPayments} setPayments={setPayments} />
    </div>
  );
};

export default Payments;
