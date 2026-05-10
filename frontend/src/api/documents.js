import { apiClient } from "./auth";

/**
 * Recupere la liste paginee des documents.
 * @param {Object} params - { search, type_document, type_support, page, page_size }
 */
export const fetchDocuments = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== "" && value != null)
  ).toString();

  return apiClient
    .get(`/documents/support/${qs ? `?${qs}` : ""}`)
    .then((response) => response.data);
};

/**
 * Recupere le detail d'un document.
 */
export const fetchDocument = (id) =>
  apiClient.get(`/documents/${id}/`).then((response) => response.data);

/**
 * Upload un nouveau document (multipart/form-data).
 * @param {FormData} formData
 */
export const uploadDocument = (formData) =>
  apiClient
    .post("/documents/support/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((response) => response.data);

/**
 * Supprime un document.
 */
export const deleteDocument = (id) =>
  apiClient.delete(`/documents/${id}/`).then((response) => response.data);

/**
 * Recupere l'URL de telechargement d'un document.
 */
export const getDownloadUrl = (id) =>
  apiClient.get(`/documents/${id}/download/`).then((response) => response.data);

// Constantes partagees avec le backend
export const TYPE_DOCUMENT_OPTIONS = [
  { value: "BPMN", label: "BPMN" },
  { value: "Rapport", label: "Rapport" },
  { value: "Preuve", label: "Preuve" },
];

export const TYPE_SUPPORT_OPTIONS = [
  { value: "Guide", label: "Guide" },
  { value: "Reglementation", label: "Reglementation" },
  { value: "Norme", label: "Norme" },
];
