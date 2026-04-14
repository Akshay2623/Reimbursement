import axios from "axios";
import { getAuthToken } from "../lib/auth";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data;
    const message =
      data?.message ||
      data?.error ||
      data?.detail ||
      (typeof data === "string" ? data : null) ||
      error.message ||
      "Request failed";
    return Promise.reject({ ...error, message });
  }
);

export default apiClient;
