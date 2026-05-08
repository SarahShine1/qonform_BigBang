import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";
import Login from "./pages/auth/Login";
import Organigramme from "./pages/organigram/Organigramme";
import MesAudits from "./pages/audit/MesAudits";
import AuditExecution from "./pages/audit/AuditExecution";

export default function App() {
  return (
    <BrowserRouter>
      {/*
        AuthProvider must be inside BrowserRouter so it can call useNavigate()
        for the logout redirect.
      */}
      <AuthProvider>
        <Routes>
          {/* ── Public routes ─────────────────────────────────── */}
          <Route path="/login" element={<Login />} />
          {/* TODO(audit-auth): remove this preview route when audit execution is linked to real auth. */}
          <Route path="/audit-preview" element={<AuditExecution />} />

          {/* ── Protected routes ──────────────────────────────── */}
          <Route element={<ProtectedRoute />}>
            {/* Default: redirect / → /organigram */}
            <Route path="/" element={<Navigate to="/organigram" replace />} />

            <Route path="/organigram" element={<Organigramme />} />

            <Route path="/mes-audits" element={<MesAudits />} />
            <Route path="/mes-audits/planifies" element={<MesAudits />} />
            <Route path="/mes-audits/clotures" element={<MesAudits />} />
            <Route path="/mes-audits/execution/:auditId" element={<AuditExecution />} />
          </Route>

          <Route element={<RoleProtectedRoute roles={["CAQ", "ADMIN", "Admin"]} />}>
            <Route path="/caq/organigramme" element={<Organigramme />} />
          </Route>

          {/* ── Catch-all ─────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
