import { apiClient } from "./auth";

export async function fetchDictionaryTerms(search = "") {
  const params = {};
  if (search) {
    params.search = search;
  }

  const { data } = await apiClient.get("/dictionary/terms/", { params });
  return Array.isArray(data) ? data : data?.results || [];
}

export async function createDictionaryTerm(payload) {
  const { data } = await apiClient.post("/dictionary/terms/", payload);
  return data;
}

export async function updateDictionaryTerm(id, payload) {
  const { data } = await apiClient.patch(`/dictionary/terms/${id}/`, payload);
  return data;
}

export async function deleteDictionaryTerm(id) {
  await apiClient.delete(`/dictionary/terms/${id}/`);
}
