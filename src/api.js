import axios from "axios";

// Single API client for the whole app. Adds the logged-in user's token to every request.
export const API_URL = "http://localhost:5000/api";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errorMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.message || err?.response?.data?.error || fallback;

export default api;
