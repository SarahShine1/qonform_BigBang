const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getHeaders(isMultipart = false) {
  const token = localStorage.getItem("access_token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isMultipart) headers["Content-Type"] = "application/json";
  return headers;
}

async function handleResponse(res) {
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { response: { status: res.status, data: error } };
  }
  if (res.status === 204) return null;
  return res.json();
}

/**
 * Récupère la liste paginée des documents.
 * @param {Object} params - { search, type_document, type_support, page, page_size }
 */
export const fetchDocuments = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== "" && v != null)
  ).toString();
  return fetch(`${BASE_URL}/documents/${qs ? "?" + qs : ""}`, {
    headers: getHeaders(),
  }).then(handleResponse);
};

/**
 * Récupère le détail d'un document.
 */
export const fetchDocument = (id) =>
  fetch(`${BASE_URL}/documents/${id}/`, {
    headers: getHeaders(),
  }).then(handleResponse);

/**
 * Upload un nouveau document (multipart/form-data).
 * @param {FormData} formData
 */
export const uploadDocument = (formData) =>
  fetch(`${BASE_URL}/documents/`, {
    method: "POST",
    headers: getHeaders(true), // pas de Content-Type → browser le set avec boundary
    body: formData,
  }).then(handleResponse);

/**
 * Supprime un document.
 */
export const deleteDocument = (id) =>
  fetch(`${BASE_URL}/documents/${id}/`, {
    method: "DELETE",
    headers: getHeaders(),
  }).then(handleResponse);

/**
 * Récupère l'URL de téléchargement d'un document.
 */
export const getDownloadUrl = (id) =>
  fetch(`${BASE_URL}/documents/${id}/download/`, {
    headers: getHeaders(),
  }).then(handleResponse);

// Constantes partagées avec le backend
export const TYPE_DOCUMENT_OPTIONS = [
  { value: "BPMN", label: "BPMN" },
  { value: "Rapport", label: "Rapport" },
  { value: "Preuve", label: "Preuve" },
];

export const TYPE_SUPPORT_OPTIONS = [
  { value: "Guide", label: "Guide" },
  { value: "Reglementation", label: "Réglementation" },
  { value: "Norme", label: "Norme" },
];