import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Typography,
  Card,
  InputNumber,
  Button,
  message,
} from "antd";
import api from "../services/api";
import moment from "moment";
import { fetchPaymentsByStudent } from "../utils/dbUtils";
import * as XLSX from "xlsx"; // 📌 Librería para exportar a Excel
import { saveAs } from "file-saver"; // 📌 Para descargar el archivo

const PaymentsByStudent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalGoal, setTotalGoal] = useState(47.56);

  useEffect(() => {
    fetchPaymentsByStudent(setData, setLoading);
    fetchTotalGoal();
  }, []);

  const fetchTotalGoal = async () => {
    try {
      const response = await api.get("/config");
      if (response.data.total_goal) {
        setTotalGoal(Number(response.data.total_goal));
      }
    } catch (error) {
      console.error("Error al obtener el total goal:", error);
    }
  };

  const updateTotalGoal = async () => {
    try {
      await api.put("/config", { total_goal: totalGoal });
      message.success("Monto total actualizado correctamente");
    } catch (error) {
      message.error("Error al actualizar el monto total");
      console.error("Error:", error);
    }
  };

  const getCompletionTag = (totalDeposited) => {
    const difference = Number(totalGoal) - Number(totalDeposited);
    if (difference <= 0) {
      return <Tag color="green">Completado</Tag>;
    }
    return <Tag color="orange">Falta completar</Tag>;
  };

  const getDifference = (totalDeposited) => {
    const difference = (Number(totalGoal) - Number(totalDeposited)).toFixed(2);
    return difference > 0 ? `$${difference}` : "$0.00";
  };

  const getStatusTag = (status) => {
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
  };

  // 📌 Función para exportar a Excel
  const exportToExcel = () => {
    const exportData = data.map((student) => ({
      "Student ID": student.studentID,
      "Full Name": student.full_name,
      "Total Deposited": `$${Number(student.total_deposited).toFixed(2)}`,
      "Total Goal": `$${Number(totalGoal).toFixed(2)}`,
      Difference: getDifference(student.total_deposited),
      Status:
        student.total_deposited >= totalGoal ? "Completado" : "Falta completar",
    }));

    // Crear hoja de Excel
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student Payments");

    // Guardar archivo
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(dataBlob, "Student_Payments.xlsx");
  };

  const columns = [
    { title: "Student ID", dataIndex: "studentID", key: "studentID" },
    { title: "Full Name", dataIndex: "full_name", key: "full_name" },
    {
      title: "Total Deposited",
      dataIndex: "total_deposited",
      key: "total_deposited",
      render: (amount) => `$${Number(amount).toFixed(2)}`,
    },
    {
      title: "Total Goal",
      dataIndex: "total_goal",
      key: "total_goal",
      render: () => `$${Number(totalGoal).toFixed(2)}`,
    },
    {
      title: "Difference",
      key: "difference",
      render: (_, record) => getDifference(record.total_deposited),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => getCompletionTag(record.total_deposited),
    },
  ];

  const expandedRowRender = (record) => {
    const subColumns = [
      {
        title: "Payment ID",
        dataIndex: "payment_id",
        key: "payment_id",
        render: (text) => <Typography.Text copyable>{text}</Typography.Text>,
      },
      {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        render: (amount) => `$${parseFloat(amount).toFixed(2)}`,
      },
      {
        title: "Date",
        dataIndex: "date",
        key: "date",
        render: (date) => moment(date).format("YYYY-MM-DD"),
      },
      {
        title: "Payment Period",
        dataIndex: "payment_period",
        key: "payment_period",
        render: (period) => period.charAt(0).toUpperCase() + period.slice(1),
      },
      {
        title: "Payment Status",
        dataIndex: "payment_status",
        key: "payment_status",
        render: (status) => getStatusTag(status),
      },
    ];

    return (
      <Table
        columns={subColumns}
        dataSource={record.payments}
        rowKey="payment_id"
        pagination={false}
      />
    );
  };

  return (
    <Card title="Student Payments Overview" bordered={false}>
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span>Total Goal: </span>
        <InputNumber
          min={0}
          value={totalGoal}
          onChange={(value) => setTotalGoal(Number(value))}
          step={0.01}
          style={{ width: 100 }}
        />
        <Button type="primary" onClick={updateTotalGoal}>
          Update Goal
        </Button>
        <Button
          type="default"
          onClick={exportToExcel}
          style={{ marginLeft: "auto" }}
        >
          📥 Export to Excel
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="studentID"
        loading={loading}
        expandable={{ expandedRowRender }}
      />
    </Card>
  );
};

export default PaymentsByStudent;
