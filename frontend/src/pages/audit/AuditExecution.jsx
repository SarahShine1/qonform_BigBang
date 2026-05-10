import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Save } from "lucide-react";
import AuditsSidebar from "../../components/audit/AuditsSidebar";
import AuditHeader from "../../components/audit/AuditHeader";
import AuditStepper from "../../components/audit/AuditStepper";
import ProcessSectionPanel from "../../components/audit/ProcessSectionPanel";
import RequirementsPanel from "../../components/audit/RequirementsPanel";
import AuditSummaryStep from "../../components/audit/AuditSummaryStep";
import { auditApi } from "../../api/audit.api";
import { complianceStatuses } from "../../data/auditExecution.mock";
import { useAuth } from "../../hooks/useAuth";

export default function AuditExecution() {
  const { auditId } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [evaluations, setEvaluations] = useState({});
  const [recommendations, setRecommendations] = useState("");
  const [correctiveActions, setCorrectiveActions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    auditApi.getExecution(auditId).then((payload) => {
      setData(payload);
      setEvaluations(payload.initialEvaluations);
    });
  }, [auditId]);

  const userName = useMemo(() => {
    if (!user) return "";
    return `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email;
  }, [user]);

  const currentSection = data?.sections[currentIndex];
  const isSummary = currentSection?.id === "summary";

  const audit = useMemo(() => {
    if (!data) return null;
    return {
      ...data.audit,
      auditor: userName || data.audit.auditor,
      status: finished ? "Publié" : data.audit.status,
    };
  }, [data, finished, userName]);

  const complianceRate = useMemo(() => {
    if (!data) return 0;
    const requirements = data.sections.flatMap((section) => section.requirements);
    const scored = requirements
      .map((requirement) => evaluations[requirement.id]?.status)
      .filter((status) => status && status !== "non_applicable");

    if (scored.length === 0) return 0;

    const scoreMap = new Map(complianceStatuses.map((status) => [status.value, status.score]));
    const score = scored.reduce((total, status) => total + (scoreMap.get(status) || 0), 0);
    return Math.round((score / scored.length) * 100);
  }, [data, evaluations]);

  const completedSectionIds = useMemo(() => {
    if (!data) return new Set();
    return new Set(
      data.sections
        .filter((section) =>
          section.id === "summary"
            ? finished
            : section.requirements.length > 0 &&
              section.requirements.every((requirement) => evaluations[requirement.id]?.status)
        )
        .map((section) => section.id)
    );
  }, [data, evaluations, finished]);

  if (!data || !audit || !currentSection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-slate-500">
        Chargement de l'audit...
      </div>
    );
  }

  const updateEvaluation = (requirementId, patch) => {
    setEvaluations((current) => ({
      ...current,
      [requirementId]: {
        status: "",
        ...current[requirementId],
        ...patch,
      },
    }));
  };

  const saveDraft = async () => {
    setSaving(true);
    await auditApi.saveDraft(buildPayload());
    setSaving(false);
  };

  const completeAudit = async () => {
    setSaving(true);
    await auditApi.completeExecution(buildPayload());
    setFinished(true);
    setSaving(false);
  };

  const buildPayload = () => ({
    auditId: audit.id,
    currentSectionId: currentSection.id,
    evaluations,
    recommendations,
    correctiveActions,
    complianceRate,
  });

  const addAction = () => {
    setCorrectiveActions((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        sectionId: data.sections[0].id,
        description: "",
      },
    ]);
  };

  const updateAction = (id, patch) => {
    setCorrectiveActions((current) =>
      current.map((action) => (action.id === id ? { ...action, ...patch } : action))
    );
  };

  const removeAction = (id) => {
    setCorrectiveActions((current) => current.filter((action) => action.id !== id));
  };

  const generateReport = () => {
    const requirements = data.sections.flatMap((section) =>
      section.requirements.map((requirement) => ({
        ...requirement,
        sectionTitle: section.title,
        status: evaluations[requirement.id]?.status || "non coté",
      }))
    );
    const statusLabels = new Map(complianceStatuses.map((status) => [status.value, status.label]));
    const rows = requirements.map((requirement) => `
      <tr>
        <td>${requirement.sectionTitle}</td>
        <td>${requirement.clause}</td>
        <td>${requirement.label}</td>
        <td>${statusLabels.get(requirement.status) || "Non coté"}</td>
      </tr>
    `).join("");
    const actions = correctiveActions.map((action) => {
      const section = data.sections.find((item) => item.id === action.sectionId);
      return `<li><strong>${section?.title || ""}</strong> - ${action.description || "Action à préciser"}</li>`;
    }).join("");
    const html = `<!doctype html>
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <title>Rapport ${audit.code}</title>
          <style>
            body{font-family:Arial,sans-serif;color:#1f2937;margin:32px}
            h1{color:#4c1d95} table{width:100%;border-collapse:collapse;margin-top:20px}
            th,td{border:1px solid #e5e7eb;padding:10px;text-align:left;font-size:13px}
            th{background:#f3f0ff;color:#4c1d95} .score{font-size:28px;color:#047857;font-weight:700}
          </style>
        </head>
        <body>
          <h1>Rapport d'audit interne</h1>
          <p><strong>Code :</strong> ${audit.code}</p>
          <p><strong>Processus :</strong> ${audit.processCode} ${audit.processName}</p>
          <p><strong>Auditeur :</strong> ${audit.auditor}</p>
          <p><strong>Date :</strong> ${audit.date}</p>
          <p class="score">Taux de conformité : ${complianceRate}%</p>
          <table>
            <thead><tr><th>Section</th><th>Réf.</th><th>Critère</th><th>Résultat</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <h2>Recommandations</h2>
          <p>${recommendations || "Aucune recommandation globale saisie."}</p>
          <h2>Actions correctives</h2>
          <ul>${actions || "<li>Aucune action corrective globale saisie.</li>"}</ul>
        </body>
      </html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rapport-${audit.code}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <AuditsSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((value) => !value)} />
        <main className="flex-1 overflow-x-hidden px-5 py-5">
          <AuditHeader
            audit={audit}
            complianceRate={complianceRate}
          />

          <div className="mt-5">
            <AuditStepper
              sections={data.sections}
              currentIndex={currentIndex}
              completedSectionIds={completedSectionIds}
              onSelect={setCurrentIndex}
            />
          </div>

          <div className="mt-5">
            {isSummary ? (
              <AuditSummaryStep
                sections={data.sections}
                evaluations={evaluations}
                complianceRate={complianceRate}
                recommendations={recommendations}
                correctiveActions={correctiveActions}
                onRecommendationsChange={setRecommendations}
                onAddAction={addAction}
                onUpdateAction={updateAction}
                onRemoveAction={removeAction}
                onComplete={completeAudit}
                onGenerateReport={generateReport}
                finished={finished}
              />
            ) : (
              <div className="grid grid-cols-[minmax(680px,1.55fr)_minmax(420px,1fr)] gap-5">
                <ProcessSectionPanel section={currentSection} sectionIndex={currentIndex} />
                <RequirementsPanel
                  section={currentSection}
                  evaluations={evaluations}
                  onChange={updateEvaluation}
                />
              </div>
            )}
          </div>

          <footer className="mt-5 flex items-center justify-between border-t border-gray-200 bg-gray-50 py-4">
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Enregistrement..." : "Enregistrer brouillon"}
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
                disabled={currentIndex === 0}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setCurrentIndex((index) => Math.min(index + 1, data.sections.length - 1))}
                disabled={currentIndex === data.sections.length - 1}
                className="rounded-lg bg-purple-700 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
