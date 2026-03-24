import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("votesetu-token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add high-accuracy GPS if available
    const gpsJson = sessionStorage.getItem("user-gps");
    if (gpsJson) {
      config.headers["x-user-coords"] = gpsJson;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for automatic logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;

      // Only redirect if not already on public pages
      if (currentPath !== "/login" && currentPath !== "/" && currentPath !== "/register") {
        // Clear authentication
        localStorage.removeItem("votesetu-token");
        localStorage.removeItem("votesetu-user");

        // Redirect to login with message (only once)
        if (!window.location.search.includes("session=expired")) {
          window.location.href = "/login?session=expired";
        }
      }
    }
    return Promise.reject(error);
  }
);
