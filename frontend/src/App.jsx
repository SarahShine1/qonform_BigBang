import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";
import Login from "./pages/auth/Login";
import ResetPassword from "./pages/auth/ResetPassword";
import AccueilPage from "./pages/accueil/AccueilPage";
import Organigramme from "./pages/organigram/Organigramme";
import MesAudits from "./pages/audit/MesAudits";
import AuditFiches from "./pages/audit/AuditFiches";
import AuditExecution from "./pages/audit/AuditExecution";
import AuditPublishedDetail from "./pages/audit/AuditPublishedDetail";
import GestionUtilisateurs from "./pages/users/GestionUtilisateurs";
import MaturityPage from "./pages/maturity/MaturityPage";
import ModulePlaceholderPage from "./pages/shared/ModulePlaceholderPage";
import FicheProcessusForm from "./pages/fiche_form/FicheProcessusForm";
import ProcessusPage from "./pages/processus/ProcessusPage";
import CanevasFichePage from "./pages/canevas/CanevasFichePage";
import NormeTemplatePage from "./pages/canevas/NormeTemplatePage";
import InteractionMapPage from "./pages/cartographie/InteractionMapPage";
import AuditTerrainPage from "./pages/audit/AuditTerrainPage";
import DashboardAuditeur from "./pages/audit/DashboardAuditeur";
import DocumentationPage from "./pages/Documentationpage";
import ChefTachesPage from "./pages/tache/ChefTachesPage";
import DossierProcessusPage from "./pages/processus/DossierProcessusPage";
import PreAuditPage from "./pages/audit/PreAuditPage";
import DashboardPilote from "./pages/pilotage/DashboardPilote";
import DashboardCAQ from "./pages/caq/DashboardCAQ";
import PVPage from "./pages/pv/PVPage";
import DashboardDG from "./pages/pilotage/DashboardDG";
import ParametresPage from "./pages/settings/ParametresPage";


export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/accueil" replace />} />
            <Route path="/accueil" element={<AccueilPage />} />

            <Route
              element={
                <RoleProtectedRoute
                  roles={["DG", "Direction generale", "Direction générale"]}
                />
              }
            >
              <Route path="/dashboard-DG" element={<DashboardDG />} />
            </Route>

            <Route
              element={
                <RoleProtectedRoute roles={["CAQ", "ADMIN", "Admin"]} />
              }
            >
            <Route path="/dashboard" element={<DashboardCAQ />} />
            </Route>
            
            <Route path="/organigramme" element={<Organigramme />} />
            <Route
              path="/gestion-utilisateurs"
              element={<GestionUtilisateurs />}
            />

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

            <Route path="/cartographie/processus" element={<ProcessusPage />} />
            <Route
              element={
                <RoleProtectedRoute
                  excludedRoles={["DG", "Direction generale", "Direction générale"]}
                />
              }
            >
              <Route
                path="/cartographie/canevas-fiche"
                element={<CanevasFichePage />}
              />
              <Route
                path="/cartographie/canevas-fiche/:id"
                element={<NormeTemplatePage />}
              />
              <Route
                path="/cartographie/interactions"
                element={<InteractionMapPage />}
              />
            </Route>
            <Route path="/suivi" element={<PVPage />} />
            <Route path="/audit/preaudit" element={<PreAuditPage />} />
            <Route path="/audit/pre-audit" element={<PreAuditPage />} />
            <Route path="/audit/mes-audits" element={<MesAudits />} />
            <Route
              path="/audit/audits-terrain"
              element={<AuditTerrainPage />}
            />
            <Route path="/dashboard-pilote" element={<DashboardPilote />} />
            <Route
              path="/dashboard-auditeur"
              element={<DashboardAuditeur />}
            />
            <Route path="/planification" element={<ChefTachesPage />} />


            <Route path="/audits" element={<MesAudits />} />
            <Route path="/mes-audits" element={<MesAudits />} />
            <Route path="/mes-audits/planifies" element={<MesAudits />} />
            <Route path="/mes-audits/clotures" element={<MesAudits />} />

            <Route path="/documents" element={<DocumentationPage />} />

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

            <Route
              path="/gestion-processus/dossier/:id"
              element={<DossierProcessusPage />}
            />
            <Route
              path="/gestion-processus/fiches/nouveau"
              element={<FicheProcessusForm />}
            />
            <Route
              path="/gestion-processus/fiches/:id/modifier"
              element={<FicheProcessusForm />}
            />

            <Route path="/niveau-maturite" element={<MaturityPage />} />

            <Route path="/parametres" element={<ParametresPage />} />
          </Route>

          <Route
            element={<RoleProtectedRoute roles={["AUDITEUR", "Auditeur"]} />}
          >
            <Route path="/auditeur/audit-fiches" element={<AuditFiches />} />
            <Route
              path="/auditeur/execution-audit/:auditId"
              element={<AuditExecution />}
            />
            <Route
              path="/auditeur/audit-execution/:auditId"
              element={<AuditExecution />}
            />
            <Route
              path="/auditeur/fiches-auditees/:idVersion"
              element={<AuditPublishedDetail />}
            />
            <Route
              path="/mes-audits/execution/:auditId"
              element={<AuditExecution />}
            />
          </Route>

          <Route
            element={<RoleProtectedRoute roles={["CAQ", "ADMIN", "Admin"]} />}
          >
            <Route path="/caq/organigramme" element={<Organigramme />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
