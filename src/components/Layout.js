import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getCurrentUser, ROLES } from '../services/authService';
import { useCourse } from '../context/CourseContext';
import CourseSelector from './CourseSelector';
import './Layout.css';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { setSelectedCourseId } = useCourse();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/students', label: 'Estudiantes', icon: '👥' },
    { path: '/payments', label: 'Pagos', icon: '💰' },
    { path: '/expenses', label: 'Gastos', icon: '💸' },
    { path: '/expense-analysis', label: 'Análisis de Gastos', icon: '📈' },
    { path: '/configurations', label: 'Configuraciones', icon: '⚙️' },
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
          <h2>💼 Finance</h2>
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

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user.name.charAt(0)}</div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-role">
                {user.role === ROLES.ADMIN ? 'Administrador' : 'Usuario'}
              </div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <button 
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
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

