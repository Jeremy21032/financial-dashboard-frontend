import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Space, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useCourse } from '../context/CourseContext';
import api from '../services/api';
import './Students.css';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const { selectedCourseId } = useCourse();

  useEffect(() => {
    if (selectedCourseId) {
      fetchStudents();
    }
  }, [selectedCourseId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/students?course_id=${selectedCourseId}`);
      setStudents(response.data);
    } catch (error) {
      message.error('Error al cargar estudiantes');
    } finally {
      setLoading(false);
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
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
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

