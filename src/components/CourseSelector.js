import React, { useState, useEffect } from 'react';
import { Select, Card, message } from 'antd';
import api from '../services/api';
import './CourseSelector.css';

const { Option } = Select;

const CourseSelector = ({ onCourseChange }) => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses/active');
      setCourses(response.data);
      
      // Seleccionar el primer curso por defecto
      if (response.data.length > 0) {
        setSelectedCourse(response.data[0].id);
        onCourseChange(response.data[0].id);
      }
    } catch (error) {
      message.error('Error al cargar los cursos');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (courseId) => {
    setSelectedCourse(courseId);
    onCourseChange(courseId);
  };

  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  return (
    <Card 
      className="course-selector-card"
      style={{ 
        marginBottom: '24px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none'
      }}
      styles={{ body: { padding: '16px 24px' } }}
    >
      <div className="course-selector-content">
        <span className="course-selector-label">
          📚 Seleccionar Curso:
        </span>
        <Select
          className="course-selector-dropdown"
          value={selectedCourse}
          onChange={handleChange}
          loading={loading}
          size="large"
          placeholder="Selecciona un curso"
        >
          {courses.map(course => (
            <Option key={course.id} value={course.id}>
              {course.level} - Paralelo {course.parallel} ({course.academic_year})
            </Option>
          ))}
        </Select>
        {selectedCourseData && (
          <div className="course-status">
            {selectedCourseData.is_active ? (
              <span className="status-badge active">
                ✓ Activo
              </span>
            ) : (
              <span className="status-badge inactive">
                ⚠ Inactivo
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default CourseSelector;

