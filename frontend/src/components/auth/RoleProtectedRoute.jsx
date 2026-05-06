import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function normalizeRole(role) {
  return String(role || "").trim().toUpperCase();
}

export default function RoleProtectedRoute({ roles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const allowed = new Set(roles.map(normalizeRole));
  const userRoles = (user?.roles || []).map(normalizeRole);
  const canAccess = userRoles.some((role) => allowed.has(role));

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

