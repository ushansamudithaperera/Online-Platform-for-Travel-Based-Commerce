import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080/api";

const instance = axios.create({
  baseURL: API_BASE,
  // 🚨 REMOVED: Do not hardcode Content-Type here!
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
      config.headers.Authorization = `Bearer ${token}`;
  }

  // 🚨 SMART LOGIC: 
  // If data is NOT a file upload (FormData), default to JSON.
  // If it IS a file upload, leave it undefined so the browser handles it.
  if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
  }

  return config;
});

export default instance;