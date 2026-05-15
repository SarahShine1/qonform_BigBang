/* eslint-disable react-hooks/immutability, react-hooks/preserve-manual-memoization, react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "./auth-context";
import { refreshToken as apiRefreshToken } from "../api/auth";
import {
  clearAuth,
  persistAuth,
  readAuthFromStorage,
  updateStoredTokens,
  updateStoredUser,
} from "../utils/authStorage";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshTimerRef = useRef(null);
  const navigate = useNavigate();

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

  const doRefresh = useCallback(async () => {
    try {
      const data = await apiRefreshToken();
      const newAccess = data.access;
      const { refresh: currentRefresh } = readAuthFromStorage();
      const newRefresh = data.refresh || currentRefresh;

      updateStoredTokens(newAccess, newRefresh);
      scheduleRefresh(newAccess);
    } catch {
      _logout();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_logout]);

  const scheduleRefresh = useCallback(
    (accessToken) => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      try {
        const { exp } = jwtDecode(accessToken);
        if (!exp) return;

        const delay = exp * 1000 - Date.now() - 5 * 60 * 1000;

        if (delay > 0) {
          refreshTimerRef.current = setTimeout(doRefresh, delay);
        } else {
          doRefresh();
        }
      } catch {
        // Ignore malformed tokens.
      }
    },
    [doRefresh],
  );

  const login = useCallback(
    ({ access, refresh, user: userData }, options = {}) => {
      persistAuth(access, refresh, userData, Boolean(options.rememberMe));
      setUser(userData);
      setIsAuthenticated(true);
      scheduleRefresh(access);
    },
    [scheduleRefresh],
  );

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
        updateStoredUser(resolvedUser);
      }

      return resolvedUser;
    });
  }, []);

  useEffect(() => {
    const { access, user: storedUser } = readAuthFromStorage();

    if (access && storedUser) {
      try {
        const { exp } = jwtDecode(access);
        if (exp && exp * 1000 > Date.now()) {
          setUser(storedUser);
          setIsAuthenticated(true);
          scheduleRefresh(access);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      }
    }

    setLoading(false);

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
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
