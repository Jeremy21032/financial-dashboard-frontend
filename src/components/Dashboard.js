import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import api from "../services/api";
import { Card, Col, Row, Statistic } from "antd";
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';

const Dashboard = () => {
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totals, setTotals] = useState({ totalPayments: 0, totalExpenses: 0 });

  useEffect(() => {
    fetchPayments();
    //fetchExpenses();
  }, []);

  const fetchPayments = () => {
    api
      .get("/payments")
      .then((response) => {
        const data = response.data;
        const totalPayments = data.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
        setPayments(data);
        setTotals((prev) => ({ ...prev, totalPayments }));
      })
      .catch((error) => console.error("Error fetching payments:", error));
  };

  const fetchExpenses = () => {
    api
      .get("/expenses")
      .then((response) => {
        const data = response.data;
        const totalExpenses = data.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
        setExpenses(data);
        setTotals((prev) => ({ ...prev, totalExpenses }));
      })
      .catch((error) => console.error("Error fetching expenses:", error));
  };

  const chartData = {
    labels: ["Payments", "Expenses"],
    datasets: [
      {
        label: "Summary",
        data: [totals.totalPayments, totals.totalExpenses],
        backgroundColor: ["#4caf50", "#f44336"],
      },
    ],
  };

  return (
    <Row gutter={24} justify="center" align="middle" style={{ marginTop: "20px" }}>
    <Col span={11}>
      <Card bordered={false} style={{ width: "100%", padding: "20px" }}>
        <Statistic
          title="Total Payments"
          value={totals.totalPayments}
          precision={2}
          valueStyle={{ color: "#3f8600", fontSize: "22px" }}
          prefix={<ArrowUpOutlined />}
          suffix="$"
        />
      </Card>
    </Col>
    <Col span={11}>
      <Card bordered={false} style={{ width: "100%", padding: "20px" }}>
        <Statistic
          title="Total Expenses"
          value={totals.totalExpenses}
          precision={2}
          valueStyle={{ color: "#cf1322", fontSize: "22px" }}
          prefix={<ArrowDownOutlined />}
          suffix="$"
        />
      </Card>
    </Col>
  </Row>
  );
};

export default Dashboard;
