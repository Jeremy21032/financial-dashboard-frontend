import React from 'react';
import DashboardStats from '../components/DashboardStats';
import { useCourse } from '../context/CourseContext';
import './Dashboard.css';

const Dashboard = () => {
  const { selectedCourseId } = useCourse();

  return (
    <div className="dashboard-container">
      {selectedCourseId && <DashboardStats courseId={selectedCourseId} />}
    </div>
  );
};

export default Dashboard;

