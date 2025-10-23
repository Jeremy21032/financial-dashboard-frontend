import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Row, Col, Statistic, Collapse, Tag, Space, Input, Select, InputNumber, Button, message } from 'antd';
import { SearchOutlined, UserOutlined, DollarOutlined, CheckCircleOutlined, ExclamationCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { useCourse } from '../context/CourseContext';
import api, { addCourseIdToQuery, getConfig } from '../services/api';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './PaymentSummary.css';

const { Panel } = Collapse;
const { Option } = Select;

const PaymentSummary = () => {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [totalGoal, setTotalGoal] = useState(0);
  const [customLimit, setCustomLimit] = useState(0);
  const [exportFilter, setExportFilter] = useState('all'); // 'all', 'up_to_date', 'pending', 'with_payments', 'without_payments'
  const { selectedCourseId } = useCourse();

  const fetchStudents = useCallback(async () => {
    try {
      const url = addCourseIdToQuery('/students', selectedCourseId);
      const response = await api.get(url);
      setStudents(response.data);
    } catch (error) {
      message.error('Error al cargar estudiantes');
      console.error(error);
    }
  }, [selectedCourseId]);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const url = addCourseIdToQuery('/payments', selectedCourseId);
      const response = await api.get(url);
      setPayments(response.data);
    } catch (error) {
      message.error('Error al cargar pagos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  const fetchConfig = useCallback(async () => {
    try {
      if (!selectedCourseId) return;
      
      console.log("🔍 [PaymentSummary] Obteniendo configuración para curso:", selectedCourseId);
      const config = await getConfig(selectedCourseId);
      console.log("🔍 [PaymentSummary] Configuración obtenida:", config);
      
      if (config.total_goal) {
        setTotalGoal(Number(config.total_goal));
        console.log("✅ [PaymentSummary] Total Goal establecido:", config.total_goal);
      } else {
        console.log("⚠️ [PaymentSummary] No hay total_goal en la configuración");
        setTotalGoal(0);
      }
    } catch (error) {
      console.error("❌ [PaymentSummary] Error al obtener configuración:", error);
      // Si no hay configuración, usar valor por defecto
      setTotalGoal(0);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchStudents();
      fetchPayments();
      fetchConfig();
    }
  }, [selectedCourseId, fetchStudents, fetchPayments, fetchConfig]);

  // Función para calcular el resumen por estudiante
  const calculateStudentSummary = (studentId) => {
    const studentPayments = payments.filter(payment => payment.student_id === studentId);
    
    // Filtrar por período si está seleccionado
    const filteredPayments = selectedPeriod 
      ? studentPayments.filter(payment => payment.payment_period === selectedPeriod)
      : studentPayments;

    const totalCollected = filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    
    // Usar el límite personalizado si está definido, sino usar el total_goal
    const limitPerStudent = customLimit > 0 ? customLimit : totalGoal;
    const expectedAmountPerStudent = limitPerStudent; // Cada estudiante debe pagar el límite
    const difference = totalCollected - expectedAmountPerStudent;
    
    return {
      totalCollected,
      expectedAmount: expectedAmountPerStudent,
      difference,
      payments: filteredPayments,
      paymentCount: filteredPayments.length
    };
  };

  // Filtrar estudiantes por búsqueda
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Calcular totales generales
  const generalTotals = students.reduce((totals, student) => {
    const summary = calculateStudentSummary(student.id);
    return {
      totalCollected: totals.totalCollected + summary.totalCollected,
      totalExpected: totals.totalExpected + summary.expectedAmount,
      totalStudents: totals.totalStudents + 1,
      studentsWithPayments: totals.studentsWithPayments + (summary.paymentCount > 0 ? 1 : 0)
    };
  }, { totalCollected: 0, totalExpected: 0, totalStudents: 0, studentsWithPayments: 0 });

  // El total esperado general debe ser: límite * número_de_estudiantes
  const limitPerStudent = customLimit > 0 ? customLimit : totalGoal;
  const totalExpectedGeneral = limitPerStudent * students.length;

  // Función para exportar resumen de pagos con filtros
  const exportPaymentSummary = () => {
    try {
      // Aplicar filtros a los estudiantes
      let filteredStudents = students;
      
      switch (exportFilter) {
        case 'up_to_date':
          filteredStudents = students.filter(student => {
            const summary = calculateStudentSummary(student.id);
            return summary.difference >= 0;
          });
          break;
        case 'pending':
          filteredStudents = students.filter(student => {
            const summary = calculateStudentSummary(student.id);
            return summary.difference < 0;
          });
          break;
        case 'with_payments':
          filteredStudents = students.filter(student => {
            const summary = calculateStudentSummary(student.id);
            return summary.paymentCount > 0;
          });
          break;
        case 'without_payments':
          filteredStudents = students.filter(student => {
            const summary = calculateStudentSummary(student.id);
            return summary.paymentCount === 0;
          });
          break;
        default: // 'all'
          filteredStudents = students;
      }

      // Preparar datos para exportación
      const exportData = filteredStudents.map(student => {
        const summary = calculateStudentSummary(student.id);
        const status = summary.difference >= 0 ? 'Al día' : 'Pendiente';
        const pendingAmount = summary.difference < 0 ? Math.abs(summary.difference) : 0;
        
        return {
          'ID Estudiante': student.id,
          'Nombre': student.name,
          'Total Pagado': summary.totalCollected.toFixed(2),
          'Total Esperado': summary.expectedAmount.toFixed(2),
          'Diferencia': summary.difference.toFixed(2),
          'Estado': status,
          'Monto Pendiente': pendingAmount.toFixed(2),
          'Número de Pagos': summary.paymentCount,
          'Último Pago': summary.payments.length > 0 
            ? moment(summary.payments[summary.payments.length - 1].date).format('DD/MM/YYYY')
            : 'Sin pagos'
        };
      });

      // Agregar resumen general
      const generalSummary = {
        'ID Estudiante': 'TOTAL GENERAL',
        'Nombre': 'RESUMEN GENERAL',
        'Total Pagado': generalTotals.totalCollected.toFixed(2),
        'Total Esperado': totalExpectedGeneral.toFixed(2),
        'Diferencia': (generalTotals.totalCollected - totalExpectedGeneral).toFixed(2),
        'Estado': (generalTotals.totalCollected - totalExpectedGeneral) >= 0 ? 'Al día' : 'Pendiente',
        'Monto Pendiente': (generalTotals.totalCollected - totalExpectedGeneral) < 0 
          ? Math.abs(generalTotals.totalCollected - totalExpectedGeneral).toFixed(2) 
          : '0.00',
        'Número de Pagos': generalTotals.studentsWithPayments,
        'Último Pago': ''
      };

      // Combinar datos
      const finalData = [...exportData, generalSummary];

      // Crear workbook
      const ws = XLSX.utils.json_to_sheet(finalData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Resumen de Pagos');

      // Generar archivo con nombre que incluya el filtro
      const filterNames = {
        'all': 'Todos',
        'up_to_date': 'Al_Dia',
        'pending': 'Pendientes',
        'with_payments': 'Con_Pagos',
        'without_payments': 'Sin_Pagos'
      };
      const fileName = `Resumen_Pagos_${filterNames[exportFilter]}_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([wbout], { type: 'application/octet-stream' }), fileName);

      message.success('Resumen exportado exitosamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      message.error('Error al exportar el resumen');
    }
  };


  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('DD/MM/YYYY'),
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
    },
    {
      title: 'Monto',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${parseFloat(amount).toFixed(2)}`,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Período',
      dataIndex: 'payment_period',
      key: 'payment_period',
      render: (period) => (
        <Tag color={period === 'first' ? 'blue' : 'green'}>
          {period === 'first' ? 'Primer Período' : 'Segundo Período'}
        </Tag>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status) => {
        const color = status === 'Acreditado' ? 'green' : 
                     status === 'Registrado' ? 'blue' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  return (
    <div id="payment-summary-container" className="payment-summary-container">
      {/* Resumen General */}
      <Row gutter={[16, 16]} className="summary-cards">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Recaudado"
              value={generalTotals.totalCollected}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Esperado"
              value={totalExpectedGeneral}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Diferencia"
              value={generalTotals.totalCollected - totalExpectedGeneral}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ 
                color: (generalTotals.totalCollected - totalExpectedGeneral) >= 0 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Estudiantes con Pagos"
              value={generalTotals.studentsWithPayments}
              suffix={`/ ${generalTotals.totalStudents}`}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Configuración de Límite Personalizado */}
      <Card title="Configuración de Límite" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <span>Límite por Estudiante:</span>
            <InputNumber
              min={0}
              value={customLimit}
              onChange={(value) => setCustomLimit(Number(value) || 0)}
              step={0.01}
              style={{ width: '100%', marginTop: 4 }}
              placeholder="Ej: 100.00"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <span>Total Goal del API:</span>
            <InputNumber
              value={totalGoal}
              disabled
              style={{ width: '100%', marginTop: 4 }}
              prefix="$"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <span>Total Esperado General:</span>
            <InputNumber
              value={totalExpectedGeneral}
              disabled
              style={{ width: '100%', marginTop: 4 }}
              prefix="$"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button 
              onClick={() => setCustomLimit(0)} 
              style={{ marginTop: 4 }}
            >
              Usar Total Goal del API
            </Button>
          </Col>
        </Row>
        <Row style={{ marginTop: 16 }} gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <span>Filtrar para exportar:</span>
            <Select
              value={exportFilter}
              onChange={setExportFilter}
              style={{ width: '100%', marginTop: 4 }}
            >
              <Option value="all">Todos los estudiantes</Option>
              <Option value="up_to_date">Solo al día</Option>
              <Option value="pending">Solo pendientes</Option>
              <Option value="with_payments">Solo con pagos</Option>
              <Option value="without_payments">Solo sin pagos</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={16}>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={exportPaymentSummary}
              size="large"
              style={{ width: '100%', marginTop: 24 }}
            >
              📊 Exportar Excel
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Filtros */}
      <Card className="filters-card" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Buscar estudiante"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filtrar por período"
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              allowClear
              style={{ width: '100%' }}
            >
              <Option value="first">Primer Período</Option>
              <Option value="second">Segundo Período</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Resumen por Estudiante */}
      <Card title="Resumen por Estudiante" className="students-summary-card">
        <Collapse accordion>
          {filteredStudents.map(student => {
            const summary = calculateStudentSummary(student.id);
            
            return (
              <Panel
                key={student.id}
                header={
                  <div className="student-header">
                    <div className="student-info">
                      <UserOutlined className="student-icon" />
                      <span className="student-name">{student.name}</span>
                    </div>
                    <div className="student-stats">
                      <Space>
                        <span className="stat">
                          <DollarOutlined /> ${summary.totalCollected.toFixed(2)}
                        </span>
                        <span className="stat">
                          <CheckCircleOutlined /> {summary.paymentCount} pagos
                        </span>
                        {summary.difference >= 0 ? (
                          <Tag color="green" icon={<CheckCircleOutlined />}>
                            Al día
                          </Tag>
                        ) : (
                          <Tag color="red" icon={<ExclamationCircleOutlined />}>
                            Pendiente: ${Math.abs(summary.difference).toFixed(2)}
                          </Tag>
                        )}
                      </Space>
                    </div>
                  </div>
                }
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic
                        title="Total Recaudado"
                        value={summary.totalCollected}
                        prefix={<DollarOutlined />}
                        precision={2}
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic
                        title="Total Esperado"
                        value={summary.expectedAmount}
                        prefix={<DollarOutlined />}
                        precision={2}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card size="small">
                      <Statistic
                        title="Diferencia"
                        value={summary.difference}
                        prefix={<DollarOutlined />}
                        precision={2}
                        valueStyle={{ 
                          color: summary.difference >= 0 ? '#3f8600' : '#cf1322' 
                        }}
                      />
                    </Card>
                  </Col>
                </Row>

                {summary.payments.length > 0 ? (
                  <div style={{ marginTop: 16 }}>
                    <h4>Detalle de Pagos</h4>
                    <Table
                      columns={columns}
                      dataSource={summary.payments}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    />
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    No hay pagos registrados para este estudiante
                  </div>
                )}
              </Panel>
            );
          })}
        </Collapse>
      </Card>
    </div>
  );
};

export default PaymentSummary;
