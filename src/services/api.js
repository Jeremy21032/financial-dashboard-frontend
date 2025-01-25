import axios from "axios";
import config from "../config";

const api = axios.create({
  baseURL: config.API_URL, // URL del backend
  headers: {
    "Content-Type": "application/json"
  },
  withCredentials: false
});

export default api;
