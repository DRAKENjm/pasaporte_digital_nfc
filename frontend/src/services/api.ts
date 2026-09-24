import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la petición era hacia el login o register, dejar que el formulario maneje el error
    const url = error.config?.url || "";
    if (
      url.startsWith("/auth/") ||
      /^\/social\/publicaciones\/[^/]+$/.test(url)
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.includes("/auth/login")) {
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
