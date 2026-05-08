import { apiClient } from "./auth";

// ── Template ───────────────────────────────────────────────────────────────
const extractList = (r) => r.data?.results ?? r.data;

export const getSectionTemplates = () =>
  apiClient.get("/fiches/template/sections/").then(extractList);

export const getChampTemplates = (sectionId) =>
  apiClient.get(`/fiches/template/sections/${sectionId}/champs/`).then(extractList);

// ── Fiches (version_fiche) ─────────────────────────────────────────────────
export const getFiches = (params = {}) =>
  apiClient.get("/fiches/", { params }).then(extractList);

export const getVersionFiche = (id) =>
  apiClient.get(`/fiches/${id}/`).then((r) => r.data);

export const createVersionFiche = (data) =>
  apiClient.post("/fiches/", data).then((r) => r.data);

export const updateVersionFiche = (id, data) =>
  apiClient.patch(`/fiches/${id}/`, data).then((r) => r.data);

// ── Champs remplis ─────────────────────────────────────────────────────────
export const getChampsFiche = (versionId) =>
  apiClient.get(`/fiches/${versionId}/champs/`).then((r) => r.data);

export const saveChampFiches = (versionId, champs) =>
  apiClient.post(`/fiches/${versionId}/champs/`, champs).then((r) => r.data);
