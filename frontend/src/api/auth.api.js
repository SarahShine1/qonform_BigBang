import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const authApi = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

/**
 * Login with email + password.
 * Django endpoint: POST /api/accounts/login/
 * Expected response: { access, refresh, user: { id, email, name, ... } }
 */
export const loginUser = async ({ email, password }) => {
  const response = await authApi.post("/accounts/login/", { email, password });
  return response.data;
};

/**
 * Google OAuth login (future).
 * Django endpoint: POST /api/accounts/google/
 */
export const googleLogin = async (googleToken) => {
  const response = await authApi.post("/accounts/google/", { token: googleToken });
  return response.data;
};