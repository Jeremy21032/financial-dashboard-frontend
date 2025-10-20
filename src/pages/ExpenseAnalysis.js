import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Table,
  Progress,
  Typography,
  Space,
  Spin,
  message,
  Button
} from 'antd';
import {
  DollarOutlined,
  ShoppingOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PieChartOutlined,
  BarChartOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useCourse } from '../context/CourseContext';
import api, { addCourseIdToQuery } from '../services/api';
import { exportToExcel, exportToPDF, exportToCSV } from '../utils/exportUtils';
import './ExpenseAnalysis.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ExpenseAnalysis = () => {
  const { selectedCourseId, selectedCourse } = useCourse();
  const [loading, setLoading] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expenseStats, setExpenseStats] = useState({
    totalExpenses: 0,
    totalPayments: 0,
    netBalance: 0,
    expenseByCategory: [],
    monthlyTrend: []
  });

  // Obtener gastos del curso seleccionado
  const fetchExpenses = async () => {
    if (!selectedCourseId) return;

    try {
      setLoading(true);
      const url = addCourseIdToQuery('/expenses', selectedCourseId);
      const response = await api.get(url);
      setExpenses(response.data);
    } catch (error) {
      message.error('Error al cargar gastos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener gastos agrupados por categoría
  const fetchExpensesGrouped = async () => {
    if (!selectedCourseId) return;

    try {
      const url = addCourseIdToQuery('/expenses/grouped', selectedCourseId);
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error al cargar gastos agrupados:', error);
      return [];
    }
  };

  // Obtener categorías del curso seleccionado
  const fetchCategories = async () => {
    if (!selectedCourseId) return;

    try {
      const url = addCourseIdToQuery('/config/categories', selectedCourseId);
      const response = await api.get(url);
      setCategories(response.data);
    } catch (error) {
      message.error('Error al cargar categorías');
      console.error(error);
    }
  };

  // Obtener pagos para calcular balance
  const fetchPayments = async () => {
    if (!selectedCourseId) return;

    try {
      const url = addCourseIdToQuery('/payments', selectedCourseId);
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error al cargar pagos:', error);
      return [];
    }
  };

  // Calcular estadísticas
  const calculateStats = async () => {
    if (!selectedCourseId || expenses.length === 0) return;

    try {
      const payments = await fetchPayments();
      const expensesGrouped = await fetchExpensesGrouped();
      
      // Total de gastos
      const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
      
      // Total de pagos
      const totalPayments = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
      
      // Balance neto
      const netBalance = totalPayments - totalExpenses;

      // Gastos por categoría usando datos agrupados del backend
      const expenseByCategory = expensesGrouped.map(item => {
        const percentage = totalExpenses > 0 ? (parseFloat(item.total) / totalExpenses) * 100 : 0;
        
        // Contar cuántos gastos hay en esta categoría
        const categoryExpenses = expenses.filter(expense => expense.category === item.category);
        
        return {
          category: item.category,
          amount: parseFloat(item.total),
          percentage: percentage,
          count: categoryExpenses.length
        };
      }).sort((a, b) => b.amount - a.amount);

      // Tendencia mensual (últimos 6 meses)
      const monthlyTrend = calculateMonthlyTrend(expenses);

      setExpenseStats({
        totalExpenses,
        totalPayments,
        netBalance,
        expenseByCategory,
        monthlyTrend
      });
    } catch (error) {
      console.error('Error al calcular estadísticas:', error);
    }
  };

  // Calcular tendencia mensual
  const calculateMonthlyTrend = (expenses) => {
    const last6Months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      
      const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === date.getMonth() && 
               expenseDate.getFullYear() === date.getFullYear();
      });
      
      const total = monthExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
      
      last6Months.push({
        month: monthName,
        amount: total
      });
    }
    
    return last6Months;
  };

  // Funciones de exportación
  const handleExportExcel = () => {
    const courseName = selectedCourse ? `${selectedCourse.level} - ${selectedCourse.parallel}` : 'Curso';
    const filename = `reporte_gastos_${courseName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
    
    const exportData = {
      ...expenseStats,
      expenses,
      expenseCount: expenses.length,
      courseName
    };

    const success = exportToExcel(exportData, filename);
    if (success) {
      message.success('Reporte exportado a Excel exitosamente');
    } else {
      message.error('Error al exportar el reporte');
    }
  };

  const handleExportPDF = () => {
    try {
      const courseName = selectedCourse ? `${selectedCourse.level} - ${selectedCourse.parallel}` : 'Curso';
      const filename = `reporte_gastos_${courseName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
      
      const exportData = {
        ...expenseStats,
        expenses,
        expenseCount: expenses.length
      };

      const success = exportToPDF(exportData, courseName, filename);
      
      if (success) {
        message.success('Reporte exportado a PDF exitosamente');
      } else {
        message.error('Error al exportar el reporte PDF');
      }
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      message.error('Error al exportar el reporte PDF: ' + error.message);
    }
  };

  const handleExportCSV = () => {
    const courseName = selectedCourse ? `${selectedCourse.level} - ${selectedCourse.parallel}` : 'Curso';
    const filename = `reporte_gastos_${courseName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`;
    
    const exportData = {
      ...expenseStats,
      expenses,
      expenseCount: expenses.length
    };

    const success = exportToCSV(exportData, filename);
    if (success) {
      message.success('Reporte exportado a CSV exitosamente');
    } else {
      message.error('Error al exportar el reporte');
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      fetchExpenses();
      fetchCategories();
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (expenses.length > 0 && categories.length > 0) {
      calculateStats();
    }
  }, [expenses, categories]);

  // Columnas para la tabla de gastos por categoría
  const categoryColumns = [
    {
      title: 'Categoría',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${parseFloat(amount).toFixed(2)}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Porcentaje',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage) => (
        <Progress 
          percent={Math.round(percentage)} 
          size="small" 
          status={percentage > 50 ? 'exception' : percentage > 30 ? 'active' : 'normal'}
        />
      ),
      sorter: (a, b) => a.percentage - b.percentage,
    },
    {
      title: 'Gastos',
      dataIndex: 'count',
      key: 'count',
      render: (count) => `${count} gasto${count !== 1 ? 's' : ''}`,
    },
  ];

  if (!selectedCourseId) {
    return (
      <div className="expense-analysis-container">
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Text type="secondary">Selecciona un curso para ver el análisis de gastos</Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="expense-analysis-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={2}>
              <PieChartOutlined style={{ marginRight: 8 }} />
              Análisis de Gastos
            </Title>
            <Text type="secondary">
              Visualiza cómo se está utilizando el presupuesto del curso
            </Text>
          </div>
          
          {expenses.length > 0 && (
            <Space>
              <Button 
                type="primary" 
                icon={<FileExcelOutlined />}
                onClick={handleExportExcel}
                style={{ backgroundColor: '#1d6f42', borderColor: '#1d6f42' }}
              >
                Excel
              </Button>
              <Button 
                type="primary" 
                icon={<FilePdfOutlined />}
                onClick={handleExportPDF}
                style={{ backgroundColor: '#dc3545', borderColor: '#dc3545' }}
              >
                PDF
              </Button>
              <Button 
                type="default" 
                icon={<FileTextOutlined />}
                onClick={handleExportCSV}
              >
                CSV
              </Button>
            </Space>
          )}
        </div>
      </div>

      <Spin spinning={loading}>
        {/* Mostrar mensaje si no hay datos */}
        {!loading && expenses.length === 0 && (
          <Card style={{ marginBottom: 24, textAlign: 'center' }}>
            <Text type="secondary">
              No hay gastos registrados para este curso. 
              <br />
              Agrega algunos gastos para ver el análisis.
            </Text>
          </Card>
        )}

        {/* Estadísticas principales */}
        {expenses.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Gastos"
                value={expenseStats.totalExpenses}
                prefix={<ShoppingOutlined />}
                suffix="USD"
                valueStyle={{ color: '#cf1322' }}
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Ingresos"
                value={expenseStats.totalPayments}
                prefix={<DollarOutlined />}
                suffix="USD"
                valueStyle={{ color: '#3f8600' }}
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Balance Neto"
                value={expenseStats.netBalance}
                prefix={expenseStats.netBalance >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                suffix="USD"
                valueStyle={{ 
                  color: expenseStats.netBalance >= 0 ? '#3f8600' : '#cf1322' 
                }}
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Gastos Promedio"
                value={expenseStats.totalExpenses / Math.max(expenses.length, 1)}
                prefix={<BarChartOutlined />}
                suffix="USD"
                precision={2}
              />
            </Card>
          </Col>
        </Row>
        )}

        {/* Gráfico de gastos por categoría */}
        {expenses.length > 0 && (
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} lg={16}>
              <Card title="Gastos por Categoría" extra={<PieChartOutlined />}>
                <Table
                  dataSource={expenseStats.expenseByCategory}
                  columns={categoryColumns}
                  pagination={false}
                  size="small"
                  rowKey="category"
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Resumen de Categorías">
                <Space direction="vertical" style={{ width: '100%' }}>
                  {expenseStats.expenseByCategory.slice(0, 5).map((item, index) => (
                    <div key={item.category} style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text strong>{item.category}</Text>
                        <Text>${parseFloat(item.amount).toFixed(2)}</Text>
                      </div>
                      <Progress 
                        percent={Math.round(item.percentage)} 
                        size="small"
                        status={index === 0 ? 'active' : 'normal'}
                      />
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>
          </Row>
        )}

        {/* Tendencia mensual */}
        {expenses.length > 0 && (
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="Tendencia de Gastos (Últimos 6 Meses)">
                <Row gutter={[16, 16]}>
                  {expenseStats.monthlyTrend.map((month, index) => (
                    <Col xs={12} sm={8} lg={4} key={month.month}>
                      <Card size="small">
                        <div style={{ textAlign: 'center' }}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {month.month}
                          </Text>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: 4 }}>
                            ${parseFloat(month.amount).toFixed(0)}
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>
        )}
      </Spin>
    </div>
  );
};

export default ExpenseAnalysis;
