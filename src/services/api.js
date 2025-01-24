import axios from "axios";

const api = axios.create({
  baseURL: process.env.BACKEND_URL, // URL del backend
});

export default api;
