import axios from 'axios';

const API_URL = process.env.REACT_BACKEND_URL || 'https://financial-dashboard-backend-six.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
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

export default api;

