import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL ;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

// Función para agregar course_id a las peticiones
export const addCourseId = (params, courseId) => {
  if (!courseId) {
    console.warn('No hay curso seleccionado');
    return params;
  }
  
  if (typeof params === 'object' && params !== null) {
    return { ...params, course_id: courseId };
  }
  
  return params;
};

// Función para agregar course_id a query params
export const addCourseIdToQuery = (url, courseId) => {
  if (!courseId) {
    console.warn('No hay curso seleccionado');
    return url;
  }
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}course_id=${courseId}`;
};

// Función para obtener configuración por curso
export const getConfig = async (courseId) => {
  try {
    const response = await api.get(`/config/?course_id=${courseId}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    throw error;
  }
};

// Función para actualizar configuración por curso
export const updateConfig = async (courseId, totalGoal) => {
  try {
    const response = await api.put('/config/', {
      course_id: courseId,
      total_goal: totalGoal
    });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    throw error;
  }
};

export default api;

