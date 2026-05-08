import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_URL || "")
  .replace(/\/api\/v1\/?$/, "")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

/**
 * Shared axios instance used by all API modules.
 * Exported so other api modules (organigram, etc.) can import it too.
 */
export const apiClient = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor ────────────────────────────────────────────────────
// Attach the stored access token to every outgoing request.
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ───────────────────────────────────────────────────
// On 401: attempt a silent token refresh, then retry the original request once.
// If the refresh also fails, clear storage and redirect to /login.
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

    // Only handle 401s that haven't already been retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        // No refresh token — clear storage and redirect
        _clearAuthAndRedirect();
        return Promise.reject(error);
      }

      if (_isRefreshing) {
        // Queue the request until the ongoing refresh completes
        return new Promise((resolve, reject) => {
          _failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      _isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE}/api/v1/auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const newAccess = data.access;
        const newRefresh = data.refresh;

        localStorage.setItem("access_token", newAccess);
        if (newRefresh) localStorage.setItem("refresh_token", newRefresh);

        apiClient.defaults.headers["Authorization"] = `Bearer ${newAccess}`;
        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;

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
  }
);

function _clearAuthAndRedirect() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

// ─── Auth API functions ─────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/token/
 * Returns { access, refresh, user: { id_user, nom, prenom, email, roles[], departement } }
 */
export async function login(email, password) {
  const { data } = await apiClient.post("/auth/token/", { email, password });
  return data;
}

/**
 * POST /api/v1/auth/token/refresh/
 * Uses the stored refresh token. Returns { access, refresh }.
 */
export async function refreshToken() {
  const refresh = localStorage.getItem("refresh_token");
  const { data } = await axios.post(`${API_BASE}/api/v1/auth/token/refresh/`, {
    refresh,
  });
  return data;
}

/**
 * GET /api/v1/auth/me/
 * Returns the current user's profile from the JWT.
 */
export async function getMe() {
  const { data } = await apiClient.get("/auth/me/");
  return data;
}
