import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CourseProvider } from './context/CourseContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import ExpenseAnalysis from './pages/ExpenseAnalysis';
import Configurations from './pages/Configurations';
import Layout from './components/Layout';
import './App.css';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <CourseProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/students" 
            element={
              <PrivateRoute>
                <Layout>
                  <Students />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/payments" 
            element={
              <PrivateRoute>
                <Layout>
                  <Payments />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/expenses" 
            element={
              <PrivateRoute>
                <Layout>
                  <Expenses />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/expense-analysis" 
            element={
              <PrivateRoute>
                <Layout>
                  <ExpenseAnalysis />
                </Layout>
              </PrivateRoute>
            } 
          />
          <Route 
            path="/configurations" 
            element={
              <PrivateRoute>
                <Layout>
                  <Configurations />
                </Layout>
              </PrivateRoute>
            } 
          />
        </Routes>
      </CourseProvider>
    </Router>
  );
}

export default App;
