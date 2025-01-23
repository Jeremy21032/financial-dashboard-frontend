import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3004/api", // URL del backend
});

export default api;
