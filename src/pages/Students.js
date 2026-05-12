import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Space, message } from 'antd';
import { SearchOutlined, PlusOutlined, FileExcelOutlined } from '@ant-design/icons';
import { useCourse } from '../context/CourseContext';
import api from '../services/api';
import { exportStudentsToExcel } from '../utils/exportStudentsExcel';
import './Students.css';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [courseMeta, setCourseMeta] = useState(null);
  const [exporting, setExporting] = useState(false);
  const { selectedCourseId } = useCourse();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/students?course_id=${selectedCourseId}`);
      setStudents(response.data);
    } catch (error) {
      message.error('Error al cargar estudiantes');
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchStudents();
    }
  }, [selectedCourseId, fetchStudents]);

  const fetchCourseMeta = useCallback(async () => {
    if (!selectedCourseId) {
      setCourseMeta(null);
      return;
    }
    try {
      const res = await api.get(`/courses/${selectedCourseId}`);
      setCourseMeta(res.data);
    } catch (e) {
      console.error(e);
      setCourseMeta(null);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    fetchCourseMeta();
  }, [fetchCourseMeta]);

  const handleExportExcel = () => {
    if (!selectedCourseId) {
      message.warning('Selecciona un curso para exportar.');
      return;
    }
    if (!students.length) {
      message.warning('No hay estudiantes para exportar.');
      return;
    }
    try {
      setExporting(true);
      exportStudentsToExcel(students, courseMeta, { searchText });
      message.success('Archivo Excel generado');
    } catch (e) {
      console.error(e);
      message.error('No se pudo generar el Excel');
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) =>
        record.name.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Paralelo',
      key: 'parallel',
      width: 120,
      render: () => (courseMeta?.parallel != null ? String(courseMeta.parallel) : '—'),
    },
  ];

  return (
    <div className="students-page">
      <div className="students-header">
        <h2>Estudiantes</h2>
        <Space className="students-actions" size="small">
          <Input
            placeholder="Buscar estudiante..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="students-search"
          />
          <Button
            type="default"
            icon={<FileExcelOutlined />}
            className="students-export-excel"
            loading={exporting}
            disabled={!selectedCourseId || !students.length}
            onClick={handleExportExcel}
          >
            Exportar Excel
          </Button>
          <Button type="primary" icon={<PlusOutlined />}>
            Agregar
          </Button>
        </Space>
      </div>

      <div className="students-table-container">
        <Table
          columns={columns}
          dataSource={students}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      </div>
    </div>
  );
};

export default Students;

