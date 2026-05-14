/* eslint-disable react-hooks/immutability, react-hooks/preserve-manual-memoization, react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "./auth-context";
import { refreshToken as apiRefreshToken } from "../api/auth";

// ─── Storage helpers ────────────────────────────────────────────────────────

function readAuthFromStorage() {
  const access = localStorage.getItem("access_token");
  if (!access) return { access: null, user: null };
  try {
    const raw = localStorage.getItem("user");
    return { access, user: raw ? JSON.parse(raw) : null };
  } catch {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    return { access: null, user: null };
  }
}

function persistAuth(access, refresh, userData) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
  localStorage.setItem("user", JSON.stringify(userData));
}

function clearAuth() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

// ─── AuthProvider ───────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshTimerRef = useRef(null);
  // useNavigate is only available inside a Router — AuthProvider must be
  // rendered inside <BrowserRouter> in App.jsx.
  const navigate = useNavigate();

  // ── doRefresh ─────────────────────────────────────────────────────────────
  const doRefresh = useCallback(async () => {
    try {
      const data = await apiRefreshToken();
      const newAccess = data.access;
      const newRefresh = data.refresh || localStorage.getItem("refresh_token");

      localStorage.setItem("access_token", newAccess);
      if (newRefresh) localStorage.setItem("refresh_token", newRefresh);

      scheduleRefresh(newAccess);
    } catch {
      // Refresh failed — log the user out
      _logout();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── scheduleRefresh ───────────────────────────────────────────────────────
  const scheduleRefresh = useCallback(
    (accessToken) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      try {
        const { exp } = jwtDecode(accessToken);
        if (!exp) return;

        // Refresh 5 minutes before expiry
        const delay = exp * 1000 - Date.now() - 5 * 60 * 1000;

        if (delay > 0) {
          refreshTimerRef.current = setTimeout(doRefresh, delay);
        } else {
          // Token already expired or expiring very soon — refresh immediately
          doRefresh();
        }
      } catch {
        // Malformed token — do nothing
      }
    },
    [doRefresh]
  );

  // ── Internal logout (no navigate dependency loop) ─────────────────────────
  const _logout = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    clearAuth();
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login", { replace: true });
  }, [navigate]);

  // ── Public login ──────────────────────────────────────────────────────────
  const login = useCallback(
    ({ access, refresh, user: userData }) => {
      persistAuth(access, refresh, userData);
      setUser(userData);
      setIsAuthenticated(true);
      scheduleRefresh(access);
    },
    [scheduleRefresh]
  );

  // ── Public logout ─────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    _logout();
  }, [_logout]);

  const updateUser = useCallback((nextUserData) => {
    setUser((currentUser) => {
      const resolvedUser =
        typeof nextUserData === "function"
          ? nextUserData(currentUser)
          : { ...(currentUser || {}), ...(nextUserData || {}) };

      if (resolvedUser) {
        localStorage.setItem("user", JSON.stringify(resolvedUser));
      }

      return resolvedUser;
    });
  }, []);

  // ── Mount: hydrate from localStorage ─────────────────────────────────────
  useEffect(() => {
    const { access, user: storedUser } = readAuthFromStorage();

    if (access && storedUser) {
      // Validate the token hasn't already expired
      try {
        const { exp } = jwtDecode(access);
        if (exp && exp * 1000 > Date.now()) {
          setUser(storedUser);
          setIsAuthenticated(true);
          scheduleRefresh(access);
        } else {
          // Token expired — clear and stay logged out
          clearAuth();
        }
      } catch {
        clearAuth();
      }
    }

    setLoading(false);

    // Cancel timer on unmount
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  // Run once on mount only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, logout, loading, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
