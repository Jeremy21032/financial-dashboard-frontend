import React, { useState, useEffect } from "react";
import { Table, Card, Col, Row, Statistic, message } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import api from "../services/api";

const Dashboard = () => {
  const [totals, setTotals] = useState({
    totalPayments: 0,
    totalExpenses: 0,
    totalDifference: 0,
  });
  const [expensePerStudent, setExpensePerStudent] = useState([]); // Nueva vista de gastos por estudiante
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Obtener Pagos, Gastos y Gastos por Estudiante en paralelo
  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, expensesRes, expensesPerStudentRes] = await Promise.all([
        api.get("/expenses"),
        api.get("/payments"),
        api.get("/expenses/expenses-per-student"), // Nueva vista
      ]);

      const totalPayments = paymentsRes.data.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const totalExpenses = expensesRes.data.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalDifference = totalPayments - totalExpenses;

      setTotals({ totalPayments, totalExpenses, totalDifference });
      setExpensePerStudent(expensesPerStudentRes.data);
    } catch (error) {
      message.error("Error al obtener los datos del dashboard.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Columnas para la tabla de gastos por estudiante
  const studentExpenseColumns = [
    { title: "Student ID", dataIndex: "student_id", key: "student_id" },
    { title: "Nombre", dataIndex: "student_name", key: "student_name" },
    { title: "Total Gastos", dataIndex: "total_expense", key: "total_expense", render: (val) => `$${val.toFixed(2)}` },
  ];

  return (
    <div style={{ padding: "20px" }}>
      {/* 🔹 Tarjetas de resumen */}
      <Row gutter={[24, 24]} justify="center">
        <Col span={7}>
          <Card bordered={false}>
            <Statistic
              title="Total Payments"
              value={totals.totalPayments}
              precision={2}
              valueStyle={{ color: "#3f8600" }}
              prefix={<ArrowUpOutlined />}
              suffix="$"
            />
          </Card>
        </Col>

        <Col span={7}>
          <Card bordered={false}>
            <Statistic
              title="Total Expenses"
              value={totals.totalExpenses}
              precision={2}
              valueStyle={{ color: "#cf1322" }}
              prefix={<ArrowDownOutlined />}
              suffix="$"
            />
          </Card>
        </Col>

        <Col span={7}>
          <Card bordered={false}>
            <Statistic
              title="Difference (Net Balance)"
              value={totals.totalDifference}
              precision={2}
              valueStyle={{
                color: totals.totalDifference >= 0 ? "#3f8600" : "#cf1322",
              }}
              prefix={totals.totalDifference >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix="$"
            />
          </Card>
        </Col>
      </Row>

      {/* 🔹 Tabla de Gastos por Estudiante */}
      <Card title="Gastos por Estudiante" bordered={false} style={{ marginTop: "20px" }}>
        <Table
          columns={studentExpenseColumns}
          dataSource={expensePerStudent}
          rowKey="student_id"
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
