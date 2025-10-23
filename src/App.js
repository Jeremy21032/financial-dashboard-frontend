import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CourseProvider } from './context/CourseContext';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Payments from './pages/Payments';
import PaymentSummary from './pages/PaymentSummary';
import Expenses from './pages/Expenses';
import ExpenseAnalysis from './pages/ExpenseAnalysis';
import Configurations from './pages/Configurations';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <Router>
      <CourseProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="/dashboard" 
            element={
              <Layout>
                <Dashboard />
              </Layout>
            } 
          />
          <Route 
            path="/students" 
            element={
              <Layout>
                <Students />
              </Layout>
            } 
          />
          <Route 
            path="/payments" 
            element={
              <Layout>
                <Payments />
              </Layout>
            } 
          />
          <Route 
            path="/payment-summary" 
            element={
              <Layout>
                <PaymentSummary />
              </Layout>
            } 
          />
          <Route 
            path="/expenses" 
            element={
              <Layout>
                <Expenses />
              </Layout>
            } 
          />
          <Route 
            path="/expense-analysis" 
            element={
              <Layout>
                <ExpenseAnalysis />
              </Layout>
            } 
          />
          <Route 
            path="/configurations" 
            element={
              <Layout>
                <Configurations />
              </Layout>
            } 
          />
        </Routes>
      </CourseProvider>
    </Router>
  );
}

export default App;
