import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import AuditHeader from "../../components/audit/AuditHeader";
import AuditStepper from "../../components/audit/AuditStepper";
import ProcessSectionPanel from "../../components/audit/ProcessSectionPanel";
import RequirementsPanel from "../../components/audit/RequirementsPanel";
import AuditSummaryStep from "../../components/audit/AuditSummaryStep";
import AppLayout from "../../components/layout/AppLayout";
import { auditApi } from "../../api/audit.api";
import { complianceStatuses } from "../../data/auditExecution.mock";
import { useAuth } from "../../hooks/useAuth";

export default function AuditExecution() {
  const { auditId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [evaluations, setEvaluations] = useState({});
  const [nonConformities, setNonConformities] = useState([]);
  const [recommendations, setRecommendations] = useState("");
  const [correctiveActions, setCorrectiveActions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [auditStatus, setAuditStatus] = useState("");
  const [reportMeta, setReportMeta] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loadingError, setLoadingError] = useState("");

  useEffect(() => {
    let active = true;

    setLoadingError("");
    setFeedback(null);
    setData(null);

    auditApi
      .getExecution(auditId)
      .then((payload) => {
        if (!active) return;
        setData(payload);
        setEvaluations(buildInitialEvaluations(payload));
        setNonConformities(mapInitialNonConformities(payload));
        setCorrectiveActions(mapInitialCorrectiveActions(payload));
        setAuditStatus(payload.audit.status || "Soumise");
        setReportMeta(payload.report || null);
      })
      .catch((error) => {
        if (!active) return;
        setLoadingError(extractApiError(error, "Impossible de charger cette fiche d'audit."));
      });

    return () => {
      active = false;
    };
  }, [auditId]);

  const userName = useMemo(() => {
    if (!user) return "";
    return `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email;
  }, [user]);

  const currentSection = data?.sections[currentIndex];
  const isSummary = currentSection?.id === "summary";
  const isPublished = ["Publie", "Publié", "Publiee"].includes(auditStatus);

  const audit = useMemo(() => {
    if (!data) return null;
    return {
      ...data.audit,
      auditor: userName || data.audit.auditor,
      status: auditStatus || data.audit.status,
    };
  }, [data, auditStatus, userName]);

  const auditMetrics = useMemo(() => calculateAuditMetrics(data, evaluations), [data, evaluations]);
  const complianceRate = auditMetrics.tauxGlobal;

  const completedSectionIds = useMemo(() => {
    if (!data) return new Set();
    return new Set(
      data.sections
        .filter((section) =>
          section.id === "summary"
            ? isPublished
            : section.requirements.length > 0 &&
              section.requirements.every((requirement) => evaluations[requirement.id]?.status)
        )
        .map((section) => section.id)
    );
  }, [data, evaluations, isPublished]);

  if (loadingError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6 text-center text-sm text-red-600">
        {loadingError}
      </div>
    );
  }

  if (!data || !audit || !currentSection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-slate-500">
        Chargement de l&apos;audit...
      </div>
    );
  }

  const buildPayload = () => ({
    auditId: audit.id,
    currentSectionId: currentSection.id,
    evaluations,
    recommendations,
    correctiveActions,
    nonConformities,
    complianceRate,
    metrics: auditMetrics,
  });

  const redirectToKanban = (message) => {
    navigate("/audit/mes-audits", {
      replace: true,
      state: {
        flash: {
          type: "success",
          message,
        },
      },
    });
  };

  const updateEvaluation = (requirementId, patch) => {
    const linkedRequirement = currentSection?.requirements?.find(
      (requirement) => String(requirement.id) === String(requirementId)
    );
    setEvaluations((current) => ({
      ...current,
      [requirementId]: {
        status: "",
        ...current[requirementId],
        sectionId: linkedRequirement?.sectionId || current[requirementId]?.sectionId || "",
        ...patch,
      },
    }));
  };

  const saveDraft = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await auditApi.saveDraft(buildPayload());
      setAuditStatus("En revision");
      redirectToKanban("Le brouillon a bien ete enregistre et la fiche est maintenant en revision.");
    } catch (error) {
      setFeedback({
        type: "error",
        message: extractApiError(
          error,
          "Le brouillon n'a pas pu etre enregistre. Verifions le backend ou l'identifiant de la fiche."
        ),
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const sendBackToPilot = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await auditApi.completeExecution(buildPayload(), "send_back");
      setAuditStatus("Brouillon");
      redirectToKanban("La fiche a bien ete renvoyee au pilote pour correction.");
    } catch (error) {
      setFeedback({
        type: "error",
        message: extractApiError(
          error,
          "Le renvoi au pilote a echoue. Aucun changement de statut n'a ete confirme."
        ),
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const publishAudit = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const response = await auditApi.completeExecution(buildPayload(), "publish");
      setAuditStatus(mapAuditStatus(response?.status) || "Publié");
      if (response?.rapport_pdf) {
        setReportMeta((current) => ({
          ...(current || {}),
          fichier: response.rapport_pdf,
        }));
      }
      redirectToKanban("La fiche a ete publiee avec succes et le rapport d'audit est maintenant lie.");
    } catch (error) {
      setFeedback({
        type: "error",
        message: extractApiError(
          error,
          "La publication a echoue. Le rapport ou le changement de statut n'a pas ete enregistre."
        ),
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const addAction = (ncId) => {
    const action = {
      id: crypto.randomUUID(),
      ncId,
      description: "",
      priority: "Moyenne",
      responsible: "",
      dueDate: "",
      status: "A faire",
    };

    setCorrectiveActions((current) => [...current, action]);
    setNonConformities((current) =>
      current.map((nc) =>
        nc.id === ncId ? { ...nc, actions: [...(nc.actions || []), action] } : nc
      )
    );
  };

  const updateAction = (id, patch) => {
    setCorrectiveActions((current) =>
      current.map((action) => (action.id === id ? { ...action, ...patch } : action))
    );
    setNonConformities((current) =>
      current.map((nc) => ({
        ...nc,
        actions: (nc.actions || []).map((action) =>
          action.id === id ? { ...action, ...patch } : action
        ),
      }))
    );
  };

  const removeAction = (id) => {
    setCorrectiveActions((current) => current.filter((action) => action.id !== id));
    setNonConformities((current) =>
      current.map((nc) => ({
        ...nc,
        actions: (nc.actions || []).filter((action) => action.id !== id),
      }))
    );
  };

  const addNonConformity = (payload) => {
    const ncId = crypto.randomUUID();
    const actions = (payload.actions || []).map((action) => ({
      ...action,
      id: action.id || crypto.randomUUID(),
      ncId,
    }));

    setNonConformities((current) => [
      ...current,
      {
        ...payload,
        id: ncId,
        sectionId: currentSection.id,
        sectionTitle: currentSection.title,
        actions,
      },
    ]);

    if (actions.length > 0) {
      setCorrectiveActions((current) => [...current, ...actions]);
    }
  };

  const generateReport = async () => {
    const filename = reportMeta?.fichier || `rapport-audit-${audit.id}.html`;
    await auditApi.downloadReport(audit.id, filename);
  };

  return (
    <AppLayout
      pageTitle="Execution de l'audit interne"
      userName={userName || audit.auditor}
      userRole="Auditeur"
      contentClassName="bg-gray-50 px-4 py-4 pb-6"
    >
      <AuditHeader audit={audit} complianceRate={complianceRate} />

      {feedback && (
        <div
          className={`mt-4 rounded-md border px-3 py-2 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="mt-4">
        <AuditStepper
          sections={data.sections}
          currentIndex={currentIndex}
          completedSectionIds={completedSectionIds}
          onSelect={setCurrentIndex}
        />
      </div>

      <div className="mt-4">
        {isSummary ? (
          <AuditSummaryStep
            sections={data.sections}
            evaluations={evaluations}
            complianceRate={complianceRate}
            auditMetrics={auditMetrics}
            recommendations={recommendations}
            correctiveActions={correctiveActions}
            nonConformities={nonConformities}
            onRecommendationsChange={setRecommendations}
            onAddAction={addAction}
            onUpdateAction={updateAction}
            onRemoveAction={removeAction}
            onSendBack={sendBackToPilot}
            onPublish={publishAudit}
            onGenerateReport={generateReport}
            isPublished={isPublished}
            isSubmitting={saving}
            currentStatus={auditStatus}
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:[grid-template-columns:minmax(0,1fr)_minmax(0,1fr)]">
            <ProcessSectionPanel section={currentSection} sectionIndex={currentIndex} />
            <RequirementsPanel
              section={currentSection}
              evaluations={evaluations}
              nonConformities={nonConformities.filter((nc) => nc.sectionId === currentSection.id)}
              onChange={updateEvaluation}
              onAddNonConformity={addNonConformity}
            />
          </div>
        )}
      </div>

      <footer className="mt-4 flex items-center justify-between border-t border-gray-200 bg-gray-50 py-3">
        <button
          type="button"
          onClick={saveDraft}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-gray-50 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Enregistrement..." : "Enregistrer brouillon"}
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
            disabled={currentIndex === 0}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Precedent
          </button>
          <button
            type="button"
            onClick={() =>
              setCurrentIndex((index) => Math.min(index + 1, data.sections.length - 1))
            }
            disabled={currentIndex === data.sections.length - 1}
            className="rounded-md bg-purple-700 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </footer>
    </AppLayout>
  );
}

function buildInitialEvaluations(payload) {
  const autoEvaluations = {};
  payload.sections.forEach((section) => {
    section.requirements.forEach((requirement) => {
      if (requirement.type === "auto" && requirement.autoStatus) {
        autoEvaluations[requirement.id] = {
          status: requirement.autoStatus,
          source: "auto",
        };
      }
    });
  });
  return {
    ...autoEvaluations,
    ...(payload.initialEvaluations || {}),
  };
}

function calculateAuditMetrics(data, evaluations) {
  if (!data) {
    return {
      tauxCompletudeMoyen: 0,
      scoreChecklist: 0,
      scoreBpmn: 0,
      scorePreuves: 0,
      tauxGlobal: 0,
    };
  }

  const scoreMap = new Map(complianceStatuses.map((statusValue) => [statusValue.value, statusValue.score]));
  const sections = data.sections.filter((section) => section.id !== "summary");
  const ficheSections = sections.filter((section) => !section.isDocumentStep);
  const bpmnSections = sections.filter((section) => section.id === "bpmn");
  const proofSections = sections.filter((section) => section.id === "preuves");

  const completionScore = average(
    ficheSections
      .map((section) => section.completionRate)
      .filter((rate) => typeof rate === "number")
  );
  const checklistScore = scoreRequirements(
    ficheSections.flatMap((section) => section.requirements),
    evaluations,
    scoreMap
  );
  const bpmnScore = scoreRequirements(
    bpmnSections.flatMap((section) => section.requirements),
    evaluations,
    scoreMap
  );
  const proofScore = scoreRequirements(
    proofSections.flatMap((section) => section.requirements),
    evaluations,
    scoreMap
  );

  const weighted = [
    { value: completionScore, weight: 0.4 },
    { value: checklistScore, weight: 0.3 },
    { value: bpmnScore, weight: 0.15 },
    { value: proofScore, weight: 0.15 },
  ].filter((item) => item.value !== null);

  const weightTotal = weighted.reduce((total, item) => total + item.weight, 0);
  const tauxGlobal =
    weightTotal === 0
      ? data.complianceRate || 0
      : Math.round(weighted.reduce((total, item) => total + item.value * item.weight, 0) / weightTotal);

  return {
    tauxCompletudeMoyen: Math.round(completionScore ?? data.metrics?.taux_completude_moyen ?? 0),
    scoreChecklist: Math.round(checklistScore ?? data.metrics?.score_checklist ?? 0),
    scoreBpmn: Math.round(bpmnScore ?? data.metrics?.score_bpmn ?? 0),
    scorePreuves: Math.round(proofScore ?? data.metrics?.score_preuves ?? 0),
    tauxGlobal,
  };
}

function scoreRequirements(requirements, evaluations, scoreMap) {
  const scores = requirements
    .map((requirement) => evaluations[requirement.id]?.status)
    .filter((statusValue) => statusValue && statusValue !== "non_applicable")
    .map((statusValue) => scoreMap.get(statusValue))
    .filter((score) => typeof score === "number")
    .map((score) => score * 100);

  return average(scores);
}

function average(values) {
  if (!values.length) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function mapInitialNonConformities(payload) {
  return (payload.nonConformities || []).map((nc) => ({
    id: String(nc.id_nc || nc.id),
    idNc: nc.id_nc,
    requirementId: nc.id_exigence ? String(nc.id_exigence) : "",
    title: nc.titre || nc.title,
    description: nc.description || "",
    severity: nc.gravite || nc.severity || "Non renseignee",
    sectionId: "",
    sectionTitle: nc.section || nc.sectionTitle || "Section non liee",
    actions: nc.actions_correctives || nc.actions || [],
  }));
}

function mapInitialCorrectiveActions(payload) {
  return (payload.nonConformities || []).flatMap((nc) =>
    (nc.actions_correctives || nc.actions || []).map((action) => ({
      id: String(action.id_action || action.id || crypto.randomUUID()),
      ncId: String(nc.id_nc || nc.id),
      description: action.description || "",
      priority: action.priority || "Moyenne",
      responsible: action.responsable || action.responsible || "",
      dueDate: action.date_echeance || action.dueDate || "",
      status: action.statut || action.status || "A faire",
    }))
  );
}

function extractApiError(error, fallbackMessage) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }
  return fallbackMessage;
}

function mapAuditStatus(status) {
  if (status === "Publiee") return "Publié";
  if (status === "En_revision") return "En revision";
  return status || "";
}
