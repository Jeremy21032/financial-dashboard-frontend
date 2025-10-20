import React from 'react';
import DashboardStats from '../components/DashboardStats';
import { useCourse } from '../context/CourseContext';

const Dashboard = () => {
  const { selectedCourseId } = useCourse();

  return (
    <div>
      {selectedCourseId && <DashboardStats courseId={selectedCourseId} />}
    </div>
  );
};

export default Dashboard;

