import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Typography,
  Card,
  InputNumber,
  Button,
  message,
  Select,
} from "antd";
import api from "../services/api";
import { useCourse } from "../context/CourseContext";
import moment from "moment";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const { Option } = Select;

const PaymentsByStudent = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalGoal, setTotalGoal] = useState(47.56);
  const [totalSpentGoal, setTotalSpentGoal] = useState(57.66);
  const [statusFilter, setStatusFilter] = useState("");
  const { selectedCourseId } = useCourse();

  useEffect(() => {
    if (selectedCourseId) {
      fetchPaymentsByStudent();
    }
    fetchConfig();
  }, [selectedCourseId]);

  const fetchPaymentsByStudent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/payments/grouped?course_id=${selectedCourseId}`);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar pagos por estudiante:', error);
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await api.get("/config");
      if (response.data.total_goal) setTotalGoal(Number(response.data.total_goal));
      if (response.data.total_spent_goal) setTotalSpentGoal(Number(response.data.total_spent_goal));
    } catch (error) {
      console.error("Error al obtener configuración:", error);
    }
  };

  const updateGoals = async () => {
    try {
      await api.put("/config", {
        total_goal: totalGoal,
        total_spent_goal: totalSpentGoal,
      });
      message.success("Montos actualizados correctamente");
    } catch (error) {
      message.error("Error al actualizar montos");
      console.error("Error:", error);
    }
  };

  function truncarFloat(num, decimales = 2) {
    const factor = Math.pow(10, decimales);
    return Math.trunc(num * factor) / factor;
  }

  const getCompletionTag = (totalDeposited) => {
    const diff = truncarFloat(totalDeposited) - truncarFloat(totalGoal);
    console.log("Total Deposited:", totalDeposited, "Total Goal:", totalGoal, "Difference:", diff);
    if (truncarFloat(diff) > 0) return <Tag color="red">Completado/Devolver</Tag>;
    if (truncarFloat(diff) === 0) return <Tag color="green">Completado</Tag>;
    return <Tag color="orange">Falta completar</Tag>;
  };

  const getDifference = (totalDeposited) =>
    `$${(truncarFloat(totalDeposited) - truncarFloat(totalGoal)).toFixed(2)}`;

  const getDifferenceSpent = (totalDeposited) =>
    `$${(totalDeposited - totalSpentGoal).toFixed(2)}`;

  const getTotalToRefund = (totalDeposited) => {
    const diffGoal = totalDeposited - totalGoal;
    const diffSpent = totalDeposited - totalSpentGoal;
    const refund = (diffGoal > 0 ? diffGoal : 0) + (diffSpent > 0 ? diffSpent : 0);
    return `$${refund.toFixed(2)}`;
  };

  const exportToExcel = () => {
    const exportData = data.map((student) => {
      const totalDeposited = Number(student.total_deposited);
      const diffGoal = totalDeposited - totalGoal;
      const diffSpent = totalDeposited - totalSpentGoal;
      const totalRefund = (diffGoal > 0 ? diffGoal : 0) + (diffSpent > 0 ? diffSpent : 0);

      return {
        "Student ID": student.studentID,
        "Full Name": student.full_name,
        "Total Deposited": `${totalDeposited.toFixed(2)}`,
        "Total Goal": `${totalGoal.toFixed(2)}`,
        "Total Spent Goal": `${totalSpentGoal.toFixed(2)}`,
        "Diff Deposit vs Goal": `${diffGoal.toFixed(2)}`,
        "Diff Deposit vs Spent": `${diffSpent.toFixed(2)}`,
        "Total to Refund": `${totalRefund.toFixed(2)}`,
        Status:
          diffGoal > 0
            ? "Completado/Devolver"
            : totalDeposited >= totalGoal
            ? "Completado"
            : "Falta completar",
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student Payments");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });
    saveAs(dataBlob, "Student_Payments.xlsx");
  };

  const handleFilterChange = (value) => {
    setStatusFilter(value);
  };

  const filteredData = statusFilter
    ? data.filter((student) => {
        const diff = Number(student.total_deposited) - totalGoal;
        const status =
          diff > 0
            ? "Completado/Devolver"
            : diff === 0
            ? "Completado"
            : "Falta completar";
        return status === statusFilter;
      })
    : data;

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
      key: "total_goal",
      render: () => `$${totalGoal.toFixed(2)}`,
    },
    {
      title: "Total Spent Goal",
      key: "total_spent_goal",
      render: () => `$${totalSpentGoal.toFixed(2)}`,
    },
    {
      title: "Diff vs Goal",
      key: "diff_goal",
      render: (_, record) => getDifference(record.total_deposited),
    },
    {
      title: "Diff vs Spent",
      key: "diff_spent",
      render: (_, record) => getDifferenceSpent(record.total_deposited),
    },
    {
      title: "Total to Refund",
      key: "total_refund",
      render: (_, record) => getTotalToRefund(record.total_deposited),
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
      },
      {
        title: "Payment Status",
        dataIndex: "payment_status",
        key: "payment_status",
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
      <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 10 }}>
        <span>Total Goal:</span>
        <InputNumber
          min={0}
          value={totalGoal}
          onChange={(value) => setTotalGoal(Number(value))}
          step={0.01}
          style={{ width: 100 }}
        />
        <span>Total Spent Goal:</span>
        <InputNumber
          min={0}
          value={totalSpentGoal}
          onChange={(value) => setTotalSpentGoal(Number(value))}
          step={0.01}
          style={{ width: 100 }}
        />
        <Button type="primary" onClick={updateGoals}>
          Update Goals
        </Button>

        <Select
          placeholder="Filter by Status"
          onChange={handleFilterChange}
          allowClear
          style={{ width: 200 }}
        >
          <Option value="Completado">Completado</Option>
          <Option value="Completado/Devolver">Completado/Devolver</Option>
          <Option value="Falta completar">Falta completar</Option>
        </Select>

        <Button type="default" onClick={exportToExcel} style={{ marginLeft: "auto" }}>
          📥 Export to Excel
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="studentID"
        loading={loading}
        expandable={{ expandedRowRender }}
      />
    </Card>
  );
};

export default PaymentsByStudent;

