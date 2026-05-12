import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import RoleProtectedRoute from "./components/auth/RoleProtectedRoute";
import Login from "./pages/auth/Login";
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
import ChefTachesPage from "./pages/tache/ChefTachesPage";
import CanevasFichePage from "./pages/canevas/CanevasFichePage";
import NormeTemplatePage from "./pages/canevas/NormeTemplatePage";
import InteractionMapPage from "./pages/cartographie/InteractionMapPage";
import AuditTerrainPage from "./pages/audit/AuditTerrainPage";
import DocumentationPage from "./pages/Documentationpage";
import DossierProcessusPage from "./pages/processus/DossierProcessusPage";
import PreAuditPage from "./pages/audit/PreAuditPage";

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
            <Route
              path="/suivi"
              element={<ModulePlaceholderPage title="Suivi" />}
            />
            <Route path="/audit/preaudit" element={<PreAuditPage />} />
            <Route path="/audit/pre-audit" element={<PreAuditPage />} />
            <Route path="/audit/mes-audits" element={<MesAudits />} />
            <Route
              path="/audit/audits-terrain"
              element={<AuditTerrainPage />}
            />
            <Route
              path="/dashboard-pilote"
              element={<ModulePlaceholderPage title="Dashboard Pilote" />}
            />
            <Route
              path="/dashboard-auditeur"
              element={<ModulePlaceholderPage title="Dashboard Auditeur" />}
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

            <Route
              path="/parametres"
              element={
                <ModulePlaceholderPage
                  pageTitle="Parametres"
                  title="Parametres"
                  description="Les parametres de la plateforme pourront etre completes ici sans changer la navigation actuelle."
                />
              }
            />
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
