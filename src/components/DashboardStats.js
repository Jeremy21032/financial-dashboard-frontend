import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Table, message, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import api from '../services/api';
import './DashboardStats.css';

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

/**
 * Agrupa filas de la vista student_expenses_share (enriquecida con category_base_amount)
 * y arma columnas que muestran gasto vs presupuesto por categoría y la diferencia.
 */
function buildExpensePerStudentTable(rawData) {
  const studentMap = new Map();
  const categorySet = new Set();

  (rawData || []).forEach((entry) => {
    const sid = entry.studentID;
    const category = entry.category || 'Sin categoría';
    const amount = parseFloat(entry.shared_amount) || 0;
    const rowBudget = parseFloat(entry.category_base_amount ?? entry.base_amount) || 0;

    if (!studentMap.has(sid)) {
      studentMap.set(sid, {
        student_id: sid,
        student_name: entry.student_name,
        total_expense: 0,
        categoryCells: {},
      });
    }

    const student = studentMap.get(sid);
    if (!student.categoryCells[category]) {
      student.categoryCells[category] = { spent: 0, budget: rowBudget };
    } else {
      const cell = student.categoryCells[category];
      if (rowBudget > 0 && cell.budget === 0) {
        cell.budget = rowBudget;
      }
    }

    const cell = student.categoryCells[category];
    cell.spent += amount;
    student.total_expense += amount;
    categorySet.add(category);
  });

  const sortedCategories = Array.from(categorySet).sort((a, b) => a.localeCompare(b));
  const dataRows = Array.from(studentMap.values());

  const columnBudget = {};
  sortedCategories.forEach((cat) => {
    for (const row of dataRows) {
      const c = row.categoryCells[cat];
      if (c?.budget > 0) {
        columnBudget[cat] = c.budget;
        return;
      }
    }
    columnBudget[cat] = 0;
  });

  const dynamicColumns = sortedCategories.map((category) => {
    const presup = columnBudget[category] || 0;
    return {
      title: (
        <div className="dashboard-col-head">
          <div className="dashboard-col-head__name">{category}</div>
          {presup > 0 ? (
            <div className="dashboard-col-head__budget">Presup. {money(presup)}</div>
          ) : (
            <div className="dashboard-col-head__budget dashboard-col-head__budget--muted">Sin presup.</div>
          )}
        </div>
      ),
      key: category,
      align: 'right',
      width: 112,
      render: (_, record) => {
        const cell = record.categoryCells[category];
        if (!cell || (cell.spent === 0 && cell.budget === 0)) {
          return '—';
        }

        const hasBudget = cell.budget > 0;
        const diff = cell.spent - cell.budget;
        const tip = hasBudget ? (
          <div className="dashboard-cat-tooltip">
            <div>Gastado: {money(cell.spent)}</div>
            <div>Presupuesto: {money(cell.budget)}</div>
            <div>
              Diferencia:{' '}
              {diff === 0 ? money(0) : `${diff > 0 ? '+' : ''}$${diff.toFixed(2)}`}
            </div>
          </div>
        ) : (
          <span>
            Gastado: {money(cell.spent)}
            <br />
            Sin presupuesto en categoría
          </span>
        );

        if (!hasBudget) {
          return (
            <Tooltip title={tip}>
              <span className="dashboard-cat-cell__spent">{money(cell.spent)}</span>
            </Tooltip>
          );
        }

        const deltaText =
          diff === 0 ? '' : `${diff > 0 ? '+' : '−'}${money(Math.abs(diff)).replace('$', '')}`;

        return (
          <Tooltip title={tip}>
            <div className="dashboard-cat-cell">
              <span className="dashboard-cat-cell__spent">{money(cell.spent)}</span>
              {diff !== 0 && (
                <span
                  className={`dashboard-cat-cell__delta ${
                    diff > 0 ? 'dashboard-cat-cell__delta--over' : 'dashboard-cat-cell__delta--under'
                  }`}
                >
                  {deltaText}
                </span>
              )}
            </div>
          </Tooltip>
        );
      },
    };
  });

  const baseColumns = [
    { title: 'Student ID', dataIndex: 'student_id', key: 'student_id' },
    { title: 'Nombre', dataIndex: 'student_name', key: 'student_name' },
    ...dynamicColumns,
    {
      title: 'Total gastos',
      dataIndex: 'total_expense',
      key: 'total_expense',
      align: 'right',
      render: (val) => money(val),
    },
  ];

  return { data: dataRows, columns: baseColumns };
}

const DashboardStats = ({ courseId }) => {
  const [totals, setTotals] = useState({
    totalPayments: 0,
    totalExpenses: 0,
    totalDifference: 0,
  });
  const [expensePerStudent, setExpensePerStudent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Obtener Pagos del curso
      const paymentsRes = await api.get(`/payments?course_id=${courseId}`);
      const totalPayments = paymentsRes.data.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      // Obtener Gastos del curso
      const expensesRes = await api.get(`/expenses?course_id=${courseId}`);
      const totalExpenses = expensesRes.data.reduce((sum, e) => sum + parseFloat(e.amount), 0);

      // Obtener Gastos por Estudiante del curso
      const expensesPerStudentRes = await api.get(`/expenses/expenses-per-student?course_id=${courseId}`);

      // Calcular Diferencia
      const totalDifference = totalPayments - totalExpenses;

      // Transformar Datos para la Tabla
      const transformedData = buildExpensePerStudentTable(expensesPerStudentRes.data);
      setExpensePerStudent(transformedData.data);
      setColumns(transformedData.columns);

      setTotals({ totalPayments, totalExpenses, totalDifference });
    } catch (error) {
      message.error('Error al obtener los datos del dashboard.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId, fetchData]);

  return (
    <div className="dashboard-stats-container">
      {/* Tarjetas de resumen */}
      <Row gutter={[16, 16]} justify="center" className="stats-cards-row">
        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="Total Payments"
              value={totals.totalPayments}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined />}
              suffix="$"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="Total Expenses"
              value={totals.totalExpenses}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined />}
              suffix="$"
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card bordered={false} className="stat-card">
            <Statistic
              title="Difference (Net Balance)"
              value={totals.totalDifference}
              precision={2}
              valueStyle={{
                color: totals.totalDifference >= 0 ? '#3f8600' : '#cf1322',
              }}
              prefix={totals.totalDifference >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix="$"
            />
          </Card>
        </Col>
      </Row>

      {/* Tabla de Gastos por Estudiante */}
      <Card
        title="Gastos por estudiante"
        extra="Presupuesto por categoría en el título de columna; en cada fila solo el gasto y la desviación."
        bordered={false}
        className="expenses-table-card"
      >
        <Table
          columns={columns}
          dataSource={expensePerStudent}
          rowKey="student_id"
          loading={loading}
          size="small"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
          className="expenses-table"
        />
      </Card>
    </div>
  );
};

export default DashboardStats;

