import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/auth/Login";
import Organigramme from "./pages/organigram/Organigramme";
import MesAudits from "./pages/audit/MesAudits";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/organigram" replace />} />

          {/* Organigram — path matches the redirect above */}
          <Route path="/organigram" element={<Organigramme />} />

          {/* Mes Audits */}
          <Route path="/mes-audits" element={<MesAudits />} />
          <Route path="/mes-audits/planifies" element={<MesAudits />} />
          <Route path="/mes-audits/clotures" element={<MesAudits />} />

          {/* Auth */}
          <Route path="/login" element={<Login />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}