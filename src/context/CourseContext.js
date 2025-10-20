import React, { createContext, useState, useContext } from 'react';

const CourseContext = createContext();

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
};

export const CourseProvider = ({ children }) => {
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  return (
    <CourseContext.Provider value={{ selectedCourseId, setSelectedCourseId }}>
      {children}
    </CourseContext.Provider>
  );
};

