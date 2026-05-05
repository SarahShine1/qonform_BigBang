import { useState } from "react";
import { AuthContext } from "./auth-context";

function readAuthFromStorage() {
  const access = localStorage.getItem("access_token");
  if (!access) return { token: null, user: null };
  try {
    const raw = localStorage.getItem("user");
    return { token: access, user: raw ? JSON.parse(raw) : null };
  } catch {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    return { token: null, user: null };
  }
}

export const AuthProvider = ({ children }) => {
  const initial = readAuthFromStorage();
  const [user, setUser] = useState(initial.user);
  const [token, setToken] = useState(initial.token);
  const loading = false;

  const login = ({ access, refresh, user: userData }) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(access);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};