import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Save, Sparkles } from "lucide-react";
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

const SECTION_WEIGHTS = {
  "contexte de lorganisation": 15,
  "contexte de lorganisme": 15,
  "contexte et processus": 15,
  leadership: 10,
  "leadership et responsabilites": 10,
  planification: 15,
  support: 10,
  "ressources et competences": 10,
  "realisation des activites operationnelles": 25,
  "realisation des activites": 25,
  "realisation operationnelle": 25,
  "evaluation des performances": 10,
  amelioration: 10,
  ameliorations: 10,
  "documents et preuves": 5,
};

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
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSaveLabel, setAutoSaveLabel] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [auditStatus, setAuditStatus] = useState("");
  const [reportMeta, setReportMeta] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loadingError, setLoadingError] = useState("");
  const payloadRef = useRef(null);
  const dirtyRef = useRef(false);

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
        setCurrentIndex(Math.min(payload.initialIndex || 0, Math.max((payload.sections || []).length - 1, 0)));
        setEvaluations(buildInitialEvaluations(payload));
        setNonConformities(mapInitialNonConformities(payload));
        setCorrectiveActions(mapInitialCorrectiveActions(payload));
        setRecommendations(payload.audit.observations || "");
        const initialStatus = payload.audit.status || "Soumise";
        setAuditStatus(initialStatus);
        setReportMeta(payload.report || null);
        if (initialStatus === "Soumise") {
          auditApi.startExecution(payload.audit.id, payload.initialIndex || 0).then((response) => {
            if (active && response?.status) {
              setAuditStatus(mapAuditStatus(response.status));
            }
          }).catch(() => {});
        }
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
  const currentSectionScore = currentSection ? auditMetrics.sectionScoresById[currentSection.id] : null;

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

  const buildPayload = useCallback(() => ({
    auditId: audit?.id,
    currentSectionId: currentSection?.id,
    currentIndex,
    evaluations,
    recommendations,
    correctiveActions,
    nonConformities,
    complianceRate,
    metrics: auditMetrics,
  }), [
    audit,
    auditMetrics,
    complianceRate,
    correctiveActions,
    currentIndex,
    currentSection,
    evaluations,
    nonConformities,
    recommendations,
  ]);

  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    if (data && audit && currentSection) {
      payloadRef.current = buildPayload();
    }
  }, [audit, buildPayload, currentSection, data]);

  const saveDraftSilently = useCallback(async (payload = buildPayload()) => {
    if (!payload?.auditId || isPublished) return;
    setAutoSaving(true);
    setAutoSaveLabel("Sauvegarde en cours...");
    try {
      await auditApi.saveDraft(payload);
      setAuditStatus("En révision");
      dirtyRef.current = false;
      setIsDirty(false);
      setAutoSaveLabel("Brouillon sauvegardé");
    } catch {
      setAutoSaveLabel("Sauvegarde non confirmée");
    } finally {
      setAutoSaving(false);
    }
  }, [buildPayload, isPublished]);

  useEffect(() => {
    if (!isDirty || !data || isPublished) return undefined;
    const timer = window.setTimeout(() => {
      saveDraftSilently();
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [data, isDirty, isPublished, saveDraftSilently]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!dirtyRef.current || !payloadRef.current || isPublished) return;
      auditApi.saveDraftOnUnload(payloadRef.current);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      handleBeforeUnload();
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isPublished]);

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

  const markDirty = () => {
    dirtyRef.current = true;
    setIsDirty(true);
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
    markDirty();
  };

  const goToSection = (nextIndex) => {
    const safeIndex = Math.max(0, Math.min(nextIndex, data.sections.length - 1));
    if (safeIndex === currentIndex) return;
    const nextSection = data.sections[safeIndex];
    if (isDirty) {
      saveDraftSilently({
        ...buildPayload(),
        currentIndex: safeIndex,
        currentSectionId: nextSection?.id,
      });
    }
    setCurrentIndex(safeIndex);
    markDirty();
  };

  const saveDraft = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      await auditApi.saveDraft(buildPayload());
      setAuditStatus("En révision");
      dirtyRef.current = false;
      setIsDirty(false);
      redirectToKanban("Le brouillon a bien été enregistré et la fiche est maintenant en révision.");
    } catch (error) {
      setFeedback({
        type: "error",
        message: extractApiError(
          error,
          "Le brouillon n'a pas pu être enregistré. Vérifions le backend ou l'identifiant de la fiche."
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
      dirtyRef.current = false;
      setIsDirty(false);
      redirectToKanban("La fiche a bien été renvoyée au pilote pour correction.");
    } catch (error) {
      setFeedback({
        type: "error",
        message: extractApiError(
          error,
          "Le renvoi au pilote a échoué. Aucun changement de statut n'a été confirmé."
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
      dirtyRef.current = false;
      setIsDirty(false);
      if (response?.rapport_pdf) {
        setReportMeta((current) => ({
          ...(current || {}),
          fichier: response.rapport_pdf,
        }));
      }
      redirectToKanban("La fiche a été publiée avec succès et le rapport d'audit est maintenant lié.");
    } catch (error) {
      setFeedback({
        type: "error",
        message: extractApiError(
          error,
          "La publication a échoué. Le rapport ou le changement de statut n'a pas été enregistré."
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
    };

    setCorrectiveActions((current) => [...current, action]);
    setNonConformities((current) =>
      current.map((nc) =>
        nc.id === ncId ? { ...nc, actions: [...(nc.actions || []), action] } : nc
      )
    );
    markDirty();
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
    markDirty();
  };

  const removeAction = (id) => {
    setCorrectiveActions((current) => current.filter((action) => action.id !== id));
    setNonConformities((current) =>
      current.map((nc) => ({
        ...nc,
        actions: (nc.actions || []).filter((action) => action.id !== id),
      }))
    );
    markDirty();
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
    markDirty();
  };

  const updateRecommendations = (value) => {
    setRecommendations(value);
    markDirty();
  };

  const generateReport = async () => {
    const filename = reportMeta?.fichier || `rapport-audit-${audit.id}.html`;
    await auditApi.downloadReport(audit.id, filename);
  };

  const openDocument = async (documentId) => {
    if (!documentId) return;
    try {
      await auditApi.openDocument(documentId);
    } catch (error) {
      setFeedback({
        type: "error",
        message: extractApiError(error, "Impossible d'ouvrir ce document."),
      });
    }
  };

  return (
    <AppLayout
      pageTitle="Execution de l'audit interne"
      userName={userName || audit.auditor}
      userRole="Auditeur"
      contentClassName="bg-gray-50 px-4 py-3 pb-5"
    >
      <AuditHeader audit={audit} complianceRate={complianceRate} />

      {autoSaveLabel && !isPublished && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-purple-100 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-sm">
          <Sparkles className={`h-3.5 w-3.5 text-purple-500 ${autoSaving ? "animate-pulse" : ""}`} />
          {autoSaveLabel}
        </div>
      )}

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

      <div className="mt-3">
        <AuditStepper
          sections={data.sections}
          currentIndex={currentIndex}
          completedSectionIds={completedSectionIds}
          onSelect={goToSection}
        />
      </div>

      <div className="mt-3">
        {isSummary ? (
          <AuditSummaryStep
            sections={data.sections}
            evaluations={evaluations}
            complianceRate={complianceRate}
            auditMetrics={auditMetrics}
            sectionScores={auditMetrics.sectionScores}
            recommendations={recommendations}
            correctiveActions={correctiveActions}
            nonConformities={nonConformities}
            onRecommendationsChange={updateRecommendations}
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
          <div className="grid grid-cols-1 gap-4 lg:[grid-template-columns:minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <ProcessSectionPanel
              section={currentSection}
              sectionIndex={currentIndex}
              sectionScore={currentSectionScore}
              onOpenDocument={openDocument}
            />
            <RequirementsPanel
              section={currentSection}
              evaluations={evaluations}
              sectionScore={currentSectionScore}
              nonConformities={nonConformities.filter((nc) => nc.sectionId === currentSection.id)}
              onChange={updateEvaluation}
              onAddNonConformity={addNonConformity}
            />
          </div>
        )}
      </div>

      <footer className="mt-3 flex items-center justify-between border-t border-gray-200 bg-gray-50 py-2.5">
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
            onClick={() => goToSection(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Precedent
          </button>
          <button
            type="button"
            onClick={() => goToSection(currentIndex + 1)}
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
      sectionScores: [],
      sectionScoresById: {},
    };
  }

  const scoreMap = new Map(complianceStatuses.map((statusValue) => [statusValue.value, statusValue.score]));
  const sections = data.sections.filter((section) => section.id !== "summary");
  const ficheSections = sections.filter((section) => !section.isDocumentStep);
  const bpmnSections = sections.filter((section) => section.id === "bpmn");
  const proofSections = sections.filter((section) => section.id === "preuves");

  const sectionScores = ficheSections.map((section, index) => {
    const completion = calculateSectionCompletion(data, section, index);
    const criteria = scoreSectionRequirements(section.requirements, evaluations);
    const score = criteria.applicableTotal === 0
      ? completion.rate
      : Math.round(completion.rate * 0.6 + criteria.rate * 0.4);
    return {
      id: section.id,
      title: section.title,
      score,
      completionRate: completion.rate,
      completionDone: completion.done,
      completionTotal: completion.total,
      completionFields: completion.fields,
      criteriaRate: criteria.rate,
      criteriaApplicable: criteria.applicableTotal,
      criteriaTotal: criteria.total,
      criteriaCounts: criteria.counts,
      criteriaLabel: criteria.applicableTotal === 0 ? "Non applicable" : `${criteria.rate}%`,
      weight: getSectionWeight(section.title),
    };
  });
  const completionScore = average(sectionScores.map((section) => section.completionRate));
  const checklistScore = average(
    sectionScores
      .filter((section) => section.criteriaApplicable > 0)
      .map((section) => section.criteriaRate)
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
  const documentScore = average([bpmnScore, proofScore].filter((score) => typeof score === "number"));

  if (typeof documentScore === "number") {
    sectionScores.push({
      id: "documents-preuves",
      title: "BPMN et preuves documentaires",
      score: Math.round(documentScore),
      completionRate: 100,
      completionDone: [...bpmnSections, ...proofSections].filter((section) =>
        section.processFields?.some((field) => isMeaningfullyFilled(field.value))
      ).length,
      completionTotal: bpmnSections.length + proofSections.length,
      completionFields: [...bpmnSections, ...proofSections].flatMap((section) => section.processFields || []),
      criteriaRate: Math.round(documentScore),
      criteriaApplicable: [...bpmnSections, ...proofSections].flatMap((section) => section.requirements || []).length,
      criteriaTotal: [...bpmnSections, ...proofSections].flatMap((section) => section.requirements || []).length,
      criteriaCounts: {
        conforme: 0,
        partiel: 0,
        nonConforme: 0,
        nonApplicable: 0,
      },
      criteriaLabel: `${Math.round(documentScore)}%`,
      weight: 5,
    });
  }

  const weighted = sectionScores.filter((item) => item.weight > 0);
  const sectionScoresById = sectionScores.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
  const weightTotal = weighted.reduce((total, item) => total + item.weight, 0);
  const tauxGlobal =
    weightTotal === 0
      ? Math.round(average(sectionScores.map((item) => item.score)) ?? data.complianceRate ?? 0)
      : Math.round(weighted.reduce((total, item) => total + item.score * item.weight, 0) / weightTotal);

  return {
    tauxCompletudeMoyen: Math.round(completionScore ?? data.metrics?.taux_completude_moyen ?? 0),
    scoreChecklist: Math.round(checklistScore ?? data.metrics?.score_checklist ?? 0),
    scoreBpmn: Math.round(bpmnScore ?? data.metrics?.score_bpmn ?? 0),
    scorePreuves: Math.round(proofScore ?? data.metrics?.score_preuves ?? 0),
    tauxGlobal,
    sectionScores,
    sectionScoresById,
  };
}

function scoreSectionRequirements(requirements, evaluations) {
  const statuses = requirements
    .map((requirement) => evaluations[requirement.id]?.status)
    .filter(Boolean);

  const counts = {
    conforme: statuses.filter((statusValue) => statusValue === "conforme").length,
    partiel: statuses.filter((statusValue) => statusValue === "partiel").length,
    nonConforme: statuses.filter((statusValue) => statusValue === "non_conforme").length,
    nonApplicable: statuses.filter((statusValue) => statusValue === "non_applicable").length,
  };
  const applicableTotal = statuses.length - counts.nonApplicable;
  const rate = applicableTotal === 0
    ? 0
    : Math.round(((counts.conforme + counts.partiel * 0.5) / applicableTotal) * 100);

  return {
    rate,
    total: statuses.length,
    applicableTotal,
    counts,
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

function calculateSectionCompletion(data, section, sectionIndex) {
  const fields = [...(section.processFields || [])];

  if (sectionIndex === 0) {
    const processMeta = data.processMeta || {};
    fields.push(
      { label: "Code du processus", value: processMeta.codeProcess || data.audit?.processCode },
      { label: "Processus amont", value: processMeta.processusAmont },
      { label: "Processus aval", value: processMeta.processusAval },
      { label: "Statut / etat du processus", value: processMeta.statutProcessus || data.audit?.status }
    );
  }

  const total = fields.length;
  const done = fields.filter((field) => isMeaningfullyFilled(field.value)).length;
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);

  return {
    done,
    total,
    rate,
    fields,
  };
}

function isMeaningfullyFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "number" || typeof value === "boolean") return true;

  if (typeof value === "string") {
    const trimmed = value.trim();
    const normalized = normalizeSectionName(trimmed);
    if (!trimmed || normalized === "non renseigne" || normalized === "non applicable") {
      return false;
    }
    if (["[", "{"].includes(trimmed[0])) {
      try {
        return isMeaningfullyFilled(JSON.parse(trimmed));
      } catch {
        return true;
      }
    }
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((item) => isMeaningfullyFilled(item));
  }

  if (typeof value === "object") {
    return Object.values(value).some((item) => isMeaningfullyFilled(item));
  }

  return Boolean(value);
}

function getSectionWeight(sectionName) {
  return SECTION_WEIGHTS[normalizeSectionName(sectionName)] || 0;
}

function normalizeSectionName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/^\s*\d+\s*[§.-]?\s*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
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
    severity: nc.gravite || nc.severity || "Non renseignée",
    sectionId: nc.id_section_template ? String(nc.id_section_template) : nc.sectionId || "",
    sectionTitle: nc.section || nc.sectionTitle || "Section non liée",
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
  if (status === "En_revision") return "En révision";
  if (status === "Brouillon") return "Brouillon";
  return status || "";
}
