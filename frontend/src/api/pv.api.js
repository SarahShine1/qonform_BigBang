import { apiClient } from "./auth";

export const pvApi = {
  getPVs: async (params = {}) => {
    const { data } = await apiClient.get("/pv/", { params });
    return data;
  },

  getPVById: async (id) => {
    const { data } = await apiClient.get(`/pv/${id}/`);
    return data;
  },

  createPV: async (payload) => {
    const formData = new FormData();
    formData.append("categorie", payload.categorie);
    formData.append("sous_type", payload.sous_type);
    formData.append("date", payload.date);
    if (Array.isArray(payload.participants)) {
      payload.participants.forEach((id) => formData.append("participants", id));
    }
    if (payload.fichier instanceof File) {
      formData.append("fichier", payload.fichier);
    }
    const { data } = await apiClient.post("/pv/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  updatePV: async (id, payload) => {
    const { data } = await apiClient.patch(`/pv/${id}/`, payload);
    return data;
  },

  deletePV: async (id) => {
    await apiClient.delete(`/pv/${id}/`);
  },

  supprimerPV: async (id) => {
  await apiClient.delete(`/pv/${id}/supprimer/`);
},

  // Workflow PV uniquement
  soumettre: async (id) => {
    const { data } = await apiClient.post(`/pv/${id}/soumettre/`);
    return data;
  },

  enregistrerDecision: async (id, decision, motif = "") => {
    const { data } = await apiClient.post(`/pv/${id}/decision/`, {
      decision,
      ...(motif ? { motif } : {}),
    });
    return data;
  },

  resoumettre: async (id) => {
    const { data } = await apiClient.post(`/pv/${id}/resoumettre/`);
    return data;
  },

  getStatutValidation: async (id) => {
    const { data } = await apiClient.get(`/pv/${id}/statut_validation/`);
    return data;
  },

  getPVStatistics: async () => {
    const { data } = await apiClient.get("/pv/statistics/");
    return data;
  },
};