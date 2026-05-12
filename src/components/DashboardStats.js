import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Table, message, Tooltip } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import api from '../services/api';
import SurplusAllocationPanel from './SurplusAllocationPanel';
import { normStudentId, buildAllocationSums, effectiveCategoryDiff } from '../utils/surplusAllocations';
import './DashboardStats.css';

const money = (n) => `$${Number(n || 0).toFixed(2)}`;

function PersistedAllocationsExpand({ record, allocations }) {
  const sid = normStudentId(record.student_id);
  const mine = (allocations || []).filter((a) => normStudentId(a.student_id) === sid);
  if (mine.length === 0) {
    return (
      <p className="dashboard-alloc-muted">
        No hay asignaciones guardadas para este estudiante. Usa la sección inferior para registrar movimientos de
        excedente.
      </p>
    );
  }
  return (
    <div className="dashboard-alloc">
      <div className="dashboard-alloc-subtitle">Asignaciones guardadas (excedente → déficit)</div>
      <table className="dashboard-alloc-table">
        <thead>
          <tr>
            <th>Desde</th>
            <th>Hacia</th>
            <th className="dashboard-alloc-num">Monto</th>
          </tr>
        </thead>
        <tbody>
          {mine.map((row) => (
            <tr key={row.id}>
              <td>{row.from_category_name}</td>
              <td>{row.to_category_name}</td>
              <td className="dashboard-alloc-num">{money(row.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * @param {Array} rawData filas expenses-per-student (con category_id si el backend lo envía)
 * @param {Array} allocations GET /surplus-allocations
 */
function buildExpensePerStudentTable(rawData, allocations = []) {
  const sums = buildAllocationSums(allocations);
  const studentMap = new Map();
  const categorySet = new Set();

  (rawData || []).forEach((entry) => {
    const sid = normStudentId(entry.studentID);
    const category = entry.category || 'Sin categoría';
    const amount = parseFloat(entry.shared_amount) || 0;
    const rowBudget = parseFloat(entry.category_base_amount ?? entry.base_amount) || 0;
    const rowCatId = entry.category_id != null ? Number(entry.category_id) : null;

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
      student.categoryCells[category] = {
        spent: 0,
        budget: rowBudget,
        categoryId: Number.isFinite(rowCatId) ? rowCatId : null,
      };
    } else {
      const cell = student.categoryCells[category];
      if (rowBudget > 0 && cell.budget === 0) {
        cell.budget = rowBudget;
      }
      if (Number.isFinite(rowCatId) && cell.categoryId == null) {
        cell.categoryId = rowCatId;
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
        const cid = cell.categoryId;

        let rawDiff = cell.spent - cell.budget;
        let effectiveDiff = rawDiff;
        let allocIn = 0;
        let allocOut = 0;
        if (hasBudget && cid != null && Number.isFinite(cid)) {
          const eff = effectiveCategoryDiff(cell.spent, cell.budget, record.student_id, cid, sums);
          rawDiff = eff.raw;
          effectiveDiff = eff.effective;
          allocIn = eff.allocIn;
          allocOut = eff.allocOut;
        }

        const tip = hasBudget ? (
          <div className="dashboard-cat-tooltip">
            <div>Gastado: {money(cell.spent)}</div>
            <div>Presupuesto: {money(cell.budget)}</div>
            <div>Diferencia bruta: {rawDiff === 0 ? money(0) : `${rawDiff > 0 ? '+' : ''}$${rawDiff.toFixed(2)}`}</div>
            {(allocIn > 0 || allocOut > 0) && (
              <div style={{ marginTop: 6 }}>
                Asignaciones: −{money(allocIn)} / +{money(allocOut)} (entra / sale)
                <br />
                <strong>Diferencia efectiva: {effectiveDiff === 0 ? money(0) : `${effectiveDiff > 0 ? '+' : ''}$${effectiveDiff.toFixed(2)}`}</strong>
              </div>
            )}
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

        const showDelta = Math.abs(effectiveDiff) > 0.005;
        const deltaText = showDelta
          ? `${effectiveDiff > 0 ? '+' : '−'}${money(Math.abs(effectiveDiff)).replace('$', '')}`
          : '';

        return (
          <Tooltip title={tip}>
            <div className="dashboard-cat-cell">
              <span className="dashboard-cat-cell__spent">{money(cell.spent)}</span>
              {showDelta && (
                <span
                  className={`dashboard-cat-cell__delta ${
                    effectiveDiff > 0
                      ? 'dashboard-cat-cell__delta--over'
                      : 'dashboard-cat-cell__delta--under'
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

  dataRows.forEach((row) => {
    const cells = row.categoryCells || {};
    row._expandable = Object.keys(cells).some((k) => cells[k]?.spent > 0 || cells[k]?.budget > 0);
  });

  return { data: dataRows, columns: baseColumns };
}

const DashboardStats = ({ courseId }) => {
  const [totals, setTotals] = useState({
    totalPayments: 0,
    totalExpenses: 0,
    totalDifference: 0,
  });
  const [expensePerStudent, setExpensePerStudent] = useState([]);
  const [rawExpenseRows, setRawExpenseRows] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState([]);

  const loadAllocations = useCallback(async () => {
    if (!courseId) return [];
    try {
      const res = await api.get(`/surplus-allocations?course_id=${courseId}`);
      return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      if (e.response?.status === 503) {
        message.warning('Asignaciones: crea la tabla surplus_allocations en MySQL (ver migrations).');
      }
      return [];
    }
  }, [courseId]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [paymentsRes, expensesRes, expensesPerStudentRes, allocList] = await Promise.all([
        api.get(`/payments?course_id=${courseId}`),
        api.get(`/expenses?course_id=${courseId}`),
        api.get(`/expenses/expenses-per-student?course_id=${courseId}`),
        loadAllocations(),
      ]);

      const totalPayments = paymentsRes.data.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const totalExpenses = expensesRes.data.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalDifference = totalPayments - totalExpenses;

      setRawExpenseRows(expensesPerStudentRes.data || []);
      setAllocations(allocList);

      const transformedData = buildExpensePerStudentTable(expensesPerStudentRes.data, allocList);
      setExpensePerStudent(transformedData.data);
      setColumns(transformedData.columns);

      setTotals({ totalPayments, totalExpenses, totalDifference });
    } catch (error) {
      message.error('Error al obtener los datos del dashboard.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [courseId, loadAllocations]);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId, fetchData]);

  const refreshAllocationsOnly = useCallback(async () => {
    const list = await loadAllocations();
    setAllocations(list);
    const transformed = buildExpensePerStudentTable(rawExpenseRows, list);
    setExpensePerStudent(transformed.data);
    setColumns(transformed.columns);
  }, [loadAllocations, rawExpenseRows]);

  return (
    <div className="dashboard-stats-container">
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

      <Card
        title="Gastos por estudiante"
        extra="Diferencia efectiva incluye asignaciones guardadas. Expande la fila para verlas."
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
          expandable={{
            rowExpandable: (record) => Boolean(record._expandable),
            expandedRowRender: (record) => (
              <PersistedAllocationsExpand record={record} allocations={allocations} />
            ),
          }}
        />
      </Card>

      {courseId && (
        <SurplusAllocationPanel
          courseId={courseId}
          rawExpenseRows={rawExpenseRows}
          allocations={allocations}
          onRefresh={refreshAllocationsOnly}
        />
      )}
    </div>
  );
};

export default DashboardStats;
