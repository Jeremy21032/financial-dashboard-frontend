import React, { useState, useEffect } from "react";
import api from "../services/api";
import { Button, DatePicker, Form, Input, Select } from "antd";
import { fetchPayments, fetchStudents } from "../utils/dbUtils";
import ImageUploader from "../components/ImageUploader"; // Importar el componente de carga de imágenes
import PaymentsTable from "../components/PaymentsTable"; // Importar la tabla de pagos

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [newPayment, setNewPayment] = useState({
    student_id: "",
    amount: "",
    date: "",
    payment_period: "first",
    payment_image: "",
    payment_status: "Registrado", // Estado por defecto
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

    fetchPayments(setPayments);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewPayment({
      ...newPayment,
      [name]: name === "amount" ? parseFloat(value) || "" : value, // Convertir a double
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
        amount: parseFloat(newPayment.amount), // Asegurar que amount sea un número
      });
      fetchPayments(setPayments);
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

      {/* Sección para mostrar los pagos */}
      <h2>Payments List</h2>
      <PaymentsTable payments={payments} setPayments={setPayments} />
    </div>
  );
};

export default Payments;
