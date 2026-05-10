import { apiClient } from "./auth";

const extractList = (r) => r.data?.results ?? r.data;

// ── Normes ─────────────────────────────────────────────────────────────────
export const getNormes = () =>
  apiClient.get("/fiches/normes/").then(extractList);

export const createNorme = (data) =>
  apiClient.post("/fiches/normes/", data).then((r) => r.data);

export const updateNorme = (id, data) =>
  apiClient.patch(`/fiches/normes/${id}/`, data).then((r) => r.data);

export const deleteNorme = (id) =>
  apiClient.delete(`/fiches/normes/${id}/`);

export const toggleNormeActive = (id) =>
  apiClient.post(`/fiches/normes/${id}/toggle-active/`).then((r) => r.data);

// ── Template sections ──────────────────────────────────────────────────────
export const getSectionTemplates = (params = {}) =>
  apiClient.get("/fiches/template/sections/", { params }).then(extractList);

export const createSection = (data) =>
  apiClient.post("/fiches/template/sections/", data).then((r) => r.data);

export const updateSection = (id, data) =>
  apiClient.patch(`/fiches/template/sections/${id}/`, data).then((r) => r.data);

export const deleteSection = (id) =>
  apiClient.delete(`/fiches/template/sections/${id}/`);

export const getChampTemplates = (sectionId) =>
  apiClient.get(`/fiches/template/sections/${sectionId}/champs/`).then(extractList);

// ── Template champs ────────────────────────────────────────────────────────
export const createChamp = (data) =>
  apiClient.post("/fiches/template/champs/", data).then((r) => r.data);

export const updateChamp = (id, data) =>
  apiClient.patch(`/fiches/template/champs/${id}/`, data).then((r) => r.data);

export const deleteChamp = (id) =>
  apiClient.delete(`/fiches/template/champs/${id}/`);

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
