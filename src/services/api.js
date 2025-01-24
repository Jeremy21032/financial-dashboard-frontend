import axios from "axios";

const api = axios.create({
  baseURL: "https://financial-dashboard-backend-six.vercel.app/api", // URL del backend
});

export default api;
