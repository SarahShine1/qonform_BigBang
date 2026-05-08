import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";
import Login from "./pages/auth/Login";
import AccueilPage from "./pages/accueil/AccueilPage";
import Organigramme from "./pages/organigram/Organigramme";
import MesAudits from "./pages/audit/MesAudits";
import GestionUtilisateurs from "./pages/users/GestionUtilisateurs";
import MaturityPage from "./pages/maturity/MaturityPage";
import ModulePlaceholderPage from "./pages/shared/ModulePlaceholderPage";
import FicheProcessusForm from "./pages/fiche_form/FicheProcessusForm";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/accueil" replace />} />
            <Route path="/accueil" element={<AccueilPage />} />

            <Route
              path="/dashboard"
              element={
                <ModulePlaceholderPage
                  pageTitle="Tableau de bord"
                  title="Tableau de bord"
                  description="Cette section servira de vue de pilotage et pourra etre reliee a des donnees reelles plus tard."
                />
              }
            />

            <Route path="/organigram" element={<Organigramme />} />
            <Route path="/organigramme" element={<Organigramme />} />
            <Route path="/gestion-utilisateurs" element={<GestionUtilisateurs />} />

            <Route
              path="/cartographie"
              element={
                <ModulePlaceholderPage
                  pageTitle="Cartographie"
                  title="Cartographie"
                  description="La cartographie des processus pourra etre detaillee ici tout en conservant le meme layout."
                />
              }
            />

            <Route
              path="/planification"
              element={
                <ModulePlaceholderPage
                  pageTitle="Planification"
                  title="Planification"
                  description="Cette section pourra accueillir la planification qualite, les echeances et les jalons de preparation."
                />
              }
            />

            <Route path="/audits" element={<MesAudits />} />
            <Route path="/mes-audits" element={<MesAudits />} />
            <Route path="/mes-audits/planifies" element={<MesAudits />} />
            <Route path="/mes-audits/clotures" element={<MesAudits />} />

            <Route
              path="/documents"
              element={
                <ModulePlaceholderPage
                  pageTitle="Documents"
                  title="Documents"
                  description="Cette page accueillera la gestion documentaire et les references qualite partagees."
                />
              }
            />

            <Route
              path="/actions"
              element={
                <ModulePlaceholderPage
                  pageTitle="Actions"
                  title="Actions"
                  description="Cette section pourra centraliser les actions correctives, preventives et les suivis associes."
                />
              }
            />

            {/* Gestion processus */}
            <Route path="/gestion-processus/fiches/nouveau" element={<FicheProcessusForm />} />
            <Route path="/gestion-processus/fiches/:id/modifier" element={<FicheProcessusForm />} />

            <Route
              path="/niveau-maturite"
              element={
                <MaturityPage />
              }
            />

            <Route
              path="/parametres"
              element={
                <ModulePlaceholderPage
                  pageTitle="Parametres"
                  title="Param\u00E8tres"
                  description="Les parametres de la plateforme pourront etre completes ici sans changer la navigation actuelle."
                />
              }
            />
          </Route>

          <Route element={<RoleProtectedRoute roles={["CAQ", "ADMIN", "Admin"]} />}>
            <Route path="/caq/organigramme" element={<Organigramme />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
