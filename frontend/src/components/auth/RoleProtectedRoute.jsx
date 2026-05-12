import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export default function RoleProtectedRoute({ roles = [], excludedRoles = [] }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const allowed = new Set(roles.map(normalizeRole).filter(Boolean));
  const excluded = new Set(excludedRoles.map(normalizeRole).filter(Boolean));
  const userRoles = (user?.roles || []).map(normalizeRole);
  const hasExcludedRole = userRoles.some((role) => excluded.has(role));
  const canAccess =
    allowed.size === 0 || userRoles.some((role) => allowed.has(role));

  if (hasExcludedRole || !canAccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

