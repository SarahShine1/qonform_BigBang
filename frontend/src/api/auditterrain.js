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

export const fetchDepartements = () =>
  fetch(`${BASE_URL}/audit/departements/`, {
    headers: getHeaders(),
  }).then(handleResponse);

export const fetchAuditsTerrain = () =>
  fetch(`${BASE_URL}/audit/terrain/`, {
    headers: getHeaders(),
  }).then(handleResponse);

export const createAuditTerrain = (formData) =>
  fetch(`${BASE_URL}/audit/terrain/`, {
    method: "POST",
    headers: getHeaders(true),
    body: formData,
  }).then(handleResponse);

export const deleteAuditTerrain = (id) =>
  fetch(`${BASE_URL}/audit/terrain/${id}/`, {
    method: "DELETE",
    headers: getHeaders(),
  }).then(handleResponse);


