import axios from "axios";
import {
  clearAuth,
  getStoredAccessToken,
  getStoredRefreshToken,
  updateStoredTokens,
} from "../utils/authStorage";

const API_BASE = (import.meta.env.VITE_API_URL || "")
  .replace(/\/api\/v1\/?$/, "")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let _isRefreshing = false;
let _failedQueue = [];

function processQueue(error, token = null) {
  _failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  _failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const refresh = getStoredRefreshToken();

      if (!refresh) {
        _clearAuthAndRedirect();
        return Promise.reject(error);
      }

      if (_isRefreshing) {
        return new Promise((resolve, reject) => {
          _failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((refreshError) => Promise.reject(refreshError));
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE}/api/v1/auth/token/refresh/`,
          { refresh },
        );

        const newAccess = data.access;
        const newRefresh = data.refresh;

        updateStoredTokens(newAccess, newRefresh);
        apiClient.defaults.headers.Authorization = `Bearer ${newAccess}`;
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        processQueue(null, newAccess);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        _clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        _isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

function _clearAuthAndRedirect() {
  clearAuth();
  window.location.href = "/login";
}

export async function login(email, password) {
  const { data } = await apiClient.post("/auth/token/", { email, password });
  return data;
}

export async function refreshToken() {
  const refresh = getStoredRefreshToken();
  const { data } = await axios.post(`${API_BASE}/api/v1/auth/token/refresh/`, {
    refresh,
  });
  return data;
}

export async function getMe() {
  const { data } = await apiClient.get("/auth/me/");
  return data;
}

export async function forgotPassword(email) {
  const { data } = await apiClient.post("/auth/password/forgot/", { email });
  return data;
}

export async function resetPassword(payload) {
  const { data } = await apiClient.post("/auth/password/reset/", payload);
  return data;
}
