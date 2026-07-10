import axios from "axios";
import { env } from "@/config/env";

/** Pre-configured Axios instance with base URL and auth interceptors. */
const api = axios.create({
  baseURL: env.API_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pf_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 (token expired/invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("pf_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;