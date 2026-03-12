import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const API_ORIGIN = API_URL ? new URL(API_URL).origin : '';

/**
 * Devuelve la URL válida para mostrar payment_image.
 * - Si el backend devuelve base64 (data:image/...) o URL absoluta (http...), se usa tal cual.
 * - Si devuelve ruta relativa (ej. /media/payments/xxx.jpg), se concatena con el origen del API.
 */
export const getPaymentImageUrl = (paymentImage) => {
  if (!paymentImage || typeof paymentImage !== 'string') return null;
  const trimmed = paymentImage.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (API_ORIGIN && trimmed.startsWith('/')) {
    return `${API_ORIGIN}${trimmed}`;
  }
  return trimmed;
};

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

