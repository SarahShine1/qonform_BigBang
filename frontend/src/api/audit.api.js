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

  const sections = (fiche.sections || []).map((section, index) => {
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
      processFields: (section.champs || []).map((champ) => ({
        label: champ.libelle,
        value: formatFieldValue(champ.valeur),
      })),
      requirements: (requirementSection?.requirements || []).map((requirement) => ({
        id: String(requirement.id_exigence),
        label: requirement.description,
        clause: requirement.code_article || `EX-${requirement.id_exigence}`,
        type: "manual",
        articleTitle: requirement.article_titre,
      })),
    };
  });

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
    initialEvaluations: mapEvaluations(fiche.evaluations || []),
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

function mapEvaluations(evaluations) {
  return evaluations.reduce((acc, evaluation) => {
    acc[String(evaluation.id_exigence)] = {
      status: DB_TO_UI_STATUS[evaluation.resultat] || "",
      observation: evaluation.commentaire || "",
    };
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
