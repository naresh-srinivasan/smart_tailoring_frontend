import axios from "axios";

// Single API client for the whole app. Adds the logged-in user's token to every request.
// Backend origin. Set VITE_API_URL in the frontend's environment (e.g. on Vercel); falls back to local dev.
export const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
export const API_URL = `${API_ORIGIN}/api`;
// Live notifications need a long-lived Socket.IO server. Vercel Functions cannot host one,
// so sockets are on for local dev only unless VITE_ENABLE_SOCKETS=true.
export const SOCKETS_ENABLED = import.meta.env.DEV || import.meta.env.VITE_ENABLE_SOCKETS === "true";

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const errorMessage = (err, fallback = "Something went wrong") =>
  err?.response?.data?.message || err?.response?.data?.error || fallback;

export default api;
