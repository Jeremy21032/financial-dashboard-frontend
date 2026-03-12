import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  FileTextOutlined,
  BankOutlined,
  LineChartOutlined,
  SettingOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import { useCourse } from '../context/CourseContext';
import CourseSelector from './CourseSelector';
import './Layout.css';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth > 767);
  const { setSelectedCourseId } = useCourse();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
    { path: '/students', label: 'Estudiantes', icon: <TeamOutlined /> },
    { path: '/payments', label: 'Pagos', icon: <DollarOutlined /> },
    { path: '/payment-summary', label: 'Resumen de Pagos', icon: <FileTextOutlined /> },
    { path: '/expenses', label: 'Gastos', icon: <BankOutlined /> },
    { path: '/expense-analysis', label: 'Análisis de Gastos', icon: <LineChartOutlined /> },
    { path: '/configurations', label: 'Configuraciones', icon: <SettingOutlined /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout-container">
      {/* Overlay para cerrar sidebar en mobile */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <span aria-hidden>💼</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => {
                navigate(item.path);
                // Cerrar sidebar en mobile después de navegar
                if (window.innerWidth <= 768) {
                  setSidebarOpen(false);
                }
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

      </aside>

      <main className="main-content">
        <header className="top-bar">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <MenuOutlined />
          </button>
          <h1 className="page-title">
            {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
          </h1>
        </header>

        <div className="content-area">
          <CourseSelector onCourseChange={setSelectedCourseId} />
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

