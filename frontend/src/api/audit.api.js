import { apiClient } from "./auth";

const DB_TO_UI_STATUS = {
  Conforme: "conforme",
  Non_conforme: "non_conforme",
  Partiel: "partiel",
  NA: "non_applicable",
};

export const auditApi = {
  getFiches: async () => {
    const { data } = await apiClient.get("/audit/fiches/");
    return data;
  },

  getFicheDetail: async (idVersion) => {
    const { data } = await apiClient.get(`/audit/fiches/${idVersion}/`);
    return data;
  },

  getExecution: async (idVersion) => {
    const { data } = await apiClient.get(`/audit/fiches/${idVersion}/`);
    return mapFicheDetailToExecution(data);
  },

  saveDraft: async (payload) => {
    const { data } = await apiClient.post(`/audit/fiches/${payload.auditId}/draft/`, payload);
    return data;
  },

  completeExecution: async (payload, action) => {
    const { data } = await apiClient.post(`/audit/fiches/${payload.auditId}/complete/`, {
      ...payload,
      action,
    });
    return data;
  },

  createNonConformity: async (idVersion, payload) => {
    const { data } = await apiClient.post(`/audit/fiches/${idVersion}/nc/`, payload);
    return data;
  },

  createCorrectiveAction: async (idNc, payload) => {
    const { data } = await apiClient.post(`/audit/nc/${idNc}/actions-correctives/`, payload);
    return data;
  },

  openReport: async (idVersion) => {
    const { data } = await apiClient.get(`/audit/fiches/${idVersion}/report/`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([data], { type: "text/html" }));
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  },

  downloadReport: async (idVersion, filename = `rapport-audit-${idVersion}.html`) => {
    const { data } = await apiClient.get(`/audit/fiches/${idVersion}/report/?download=1`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([data], { type: "text/html" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  },
};

function mapFicheDetailToExecution(fiche) {
  const sectionRequirements = fiche.section_requirements || distributeRequirementsBySection(
    fiche.exigences || [],
    fiche.sections || []
  );

  const ficheSections = (fiche.sections || []).map((section, index) => {
    const requirementSection =
      sectionRequirements.find(
        (item) =>
          String(item.id_section_template ?? "") ===
          String(section.id_section_template ?? "")
      ) || sectionRequirements[index];

    return {
      id: String(section.id_section_template || `section-${index + 1}`),
      title: section.nom,
      shortTitle: section.nom,
      completionRate: section.completion_rate,
      completionDone: section.completion_done,
      completionTotal: section.completion_total,
      processFields: (section.champs || []).map((champ) => ({
        label: champ.libelle,
        value: formatFieldValue(champ.valeur),
      })),
      requirements: (requirementSection?.requirements || []).map((requirement) => ({
        id: String(requirement.id_critere || requirement.id_exigence),
        sectionId: String(section.id_section_template || ""),
        label: requirement.description,
        clause: requirement.code_article || `CR-${requirement.id_critere || requirement.id_exigence}`,
        type: "manual",
        articleTitle: requirement.article_titre,
      })),
    };
  });

  const documents = fiche.documents || {};
  const sections = [
    ...ficheSections,
    buildDocumentSection({
      id: "bpmn",
      title: "Evaluation BPMN",
      shortTitle: "BPMN",
      emptyLabel: "Aucun BPMN lie a cette version de fiche.",
      documents: documents.bpmn || [],
    }),
    buildDocumentSection({
      id: "preuves",
      title: "Evaluation des preuves et enregistrements",
      shortTitle: "Preuves",
      emptyLabel: "Aucune preuve ou enregistrement lie a cette version de fiche.",
      documents: documents.preuves || [],
    }),
  ];

  sections.push({
    id: "summary",
    title: "Synthèse / clôture",
    shortTitle: "Synthèse",
    processFields: [
      { label: "Objectif", value: "Consolider les constats, recommandations et actions correctives." },
      { label: "Sortie attendue", value: "Audit terminé et rapport prêt à générer." },
    ],
    requirements: [],
  });

  return {
    audit: {
      id: String(fiche.id_version),
      code: `AUD-FICHE-${fiche.id_version}`,
      processCode: fiche.processus?.code_process || "",
      processName: fiche.processus?.nom || "",
      auditor:
        `${fiche.audit?.auditeur?.prenom || ""} ${fiche.audit?.auditeur?.nom || ""}`.trim(),
      date:
        fiche.audit?.date_realisation ||
        fiche.date_validation ||
        fiche.date_creation ||
        new Date().toISOString().slice(0, 10),
      status: mapVersionStatusToUi(fiche.statut),
    },
    sections,
    initialEvaluations: {
      ...mapEvaluations(fiche.evaluations || []),
      ...mapDocumentEvaluations(documents),
    },
    nonConformities: (fiche.non_conformites || []).map((item) => ({
      id: String(item.id_nc),
      idNc: item.id_nc,
      requirementId: item.id_exigence ? String(item.id_exigence) : "",
      title: item.titre,
      description: item.description || "",
      severity: item.gravite || "Non renseignée",
      sectionId: "",
      sectionTitle: item.section || "Section non liée",
      actions: (item.actions_correctives || []).map((action) => ({
        id: String(action.id_action),
        ncId: String(item.id_nc),
        description: action.description || "",
        responsible: action.responsable || "",
        dueDate: action.date_echeance || "",
        priority: "Moyenne",
        status: action.statut || "A faire",
      })),
    })),
    complianceRate: fiche.taux_conformite || 0,
    metrics: fiche.metrics || null,
    documents,
    sourceFiche: fiche,
    report: fiche.rapport || null,
  };
}

function distributeRequirementsBySection(requirements, sections) {
  const buckets = (sections || []).map((section) => ({
    id_section_template: section.id_section_template,
    nom: section.nom,
    requirements: [],
  }));

  if (buckets.length === 0) {
    return [];
  }

  requirements.forEach((requirement, index) => {
    const bucket = buckets[index % buckets.length];
    bucket.requirements.push(requirement);
  });

  return buckets;
}

function buildDocumentSection({ id, title, shortTitle, emptyLabel, documents }) {
  const safeDocuments = documents || [];
  return {
    id,
    title,
    shortTitle,
    isDocumentStep: true,
    completionRate: null,
    processFields:
      safeDocuments.length > 0
        ? safeDocuments.map((document) => ({
            label: document.nom_fichier || `Document ${document.id_document}`,
            value: document.chemin_stockage || document.description || "Document lie a la fiche",
            valid: true,
          }))
        : [{ label: "Documents", value: emptyLabel, valid: false }],
    requirements: safeDocuments.map((document) => ({
      id: `doc-${document.id_document}`,
      documentId: document.id_document,
      label: document.nom_fichier || `Document ${document.id_document}`,
      clause: document.type_document || "Document",
      type: "document",
      articleTitle: document.chemin_stockage || document.description || "",
    })),
  };
}

function mapEvaluations(evaluations) {
  return evaluations.reduce((acc, evaluation) => {
    const requirementId = evaluation.id_critere || evaluation.id_exigence;
    if (!requirementId) return acc;
    acc[String(requirementId)] = {
      status: DB_TO_UI_STATUS[evaluation.resultat] || "",
      observation: evaluation.commentaire || "",
      sectionId: evaluation.id_section_template ? String(evaluation.id_section_template) : "",
    };
    return acc;
  }, {});
}

function mapDocumentEvaluations(documents = {}) {
  return [...(documents.bpmn || []), ...(documents.preuves || [])].reduce((acc, document) => {
    if (document.evaluation) {
      acc[`doc-${document.id_document}`] = {
        status: DB_TO_UI_STATUS[document.evaluation] || "",
        observation: "",
      };
    }
    return acc;
  }, {});
}

function formatFieldValue(value) {
  if (value === null || value === undefined || value === "") return "Non renseigné";
  if (typeof value === "object") return JSON.stringify(value);
  return value;
}

function mapVersionStatusToUi(status) {
  if (status === "Publiee") return "Publié";
  if (status === "En_revision") return "En révision";
  return "Soumise";
}
