import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

/**
 * Wraps protected routes.
 * - While auth state is loading: show a spinner.
 * - If not authenticated: redirect to /login.
 * - If authenticated: render the child routes via <Outlet />.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
        }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// ─── Inline spinner (no extra file needed) ──────────────────────────────────
function LoadingSpinner() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="20"
        cy="20"
        r="16"
        stroke="#E5E7EB"
        strokeWidth="4"
      />
      <path
        d="M20 4a16 16 0 0 1 16 16"
        stroke="#5B1FA8"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
