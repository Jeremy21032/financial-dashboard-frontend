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
  const [expensePerStudent, setExpensePerStudent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  // 🔹 Obtener Pagos, Gastos y Gastos por Estudiante en secuencia
  const fetchPayments = async () => {
    try {
      setLoading(true);

      // 🔹 1. Obtener Pagos
      const paymentsRes = await api.get("/payments");
      const totalPayments = paymentsRes.data.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      // 🔹 2. Obtener Gastos
      const expensesRes = await api.get("/expenses");
      const totalExpenses = expensesRes.data.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      // 🔹 3. Obtener Gastos por Estudiante
      const expensesPerStudentRes = await api.get("/expenses/expenses-per-student");

      // 🔹 Calcular Diferencia
      const totalDifference = totalPayments - totalExpenses;

      // 🔹 Transformar Datos para la Tabla
      const transformedData = transformData(expensesPerStudentRes.data);
      setExpensePerStudent(transformedData.data);
      setColumns(transformedData.columns);

      // 🔹 Actualizar estados
      setTotals({ totalPayments, totalExpenses, totalDifference });
    } catch (error) {
      message.error("Error al obtener los datos del dashboard.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Función para transformar los datos en un formato adecuado para la tabla
  const transformData = (rawData) => {
    const studentMap = new Map();
    const categorySet = new Set();

    rawData.forEach((entry) => {
      if (!studentMap.has(entry.studentID)) {
        studentMap.set(entry.studentID, {
          student_id: entry.studentID,
          student_name: entry.student_name,
          total_expense: 0,
        });
      }

      const student = studentMap.get(entry.studentID);
      const category = entry.category;
      const amount = parseFloat(entry.shared_amount);

      student[category] = (student[category] || 0) + amount;
      student.total_expense += amount;
      categorySet.add(category);
    });

    // 🔹 Definir las columnas dinámicas
    const dynamicColumns = Array.from(categorySet).map((category) => ({
      title: category,
      dataIndex: category,
      key: category,
      render: (val) => (val ? `$${val.toFixed(2)}` : "-"),
    }));

    // 🔹 Columnas base
    const baseColumns = [
      { title: "Student ID", dataIndex: "student_id", key: "student_id" },
      { title: "Nombre", dataIndex: "student_name", key: "student_name" },
      ...dynamicColumns,
      { title: "Total Gastos", dataIndex: "total_expense", key: "total_expense", render: (val) => `$${val.toFixed(2)}` },
    ];

    return { data: Array.from(studentMap.values()), columns: baseColumns };
  };

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
          columns={columns}
          dataSource={expensePerStudent}
          rowKey="student_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
