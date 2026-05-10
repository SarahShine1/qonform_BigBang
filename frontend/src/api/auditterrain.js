import { apiClient } from "./auth";

export const fetchDepartements = async () => {
  const response = await apiClient.get("/audit/departements/");
  return response.data;
};

export const fetchAuditsTerrain = async () => {
  const response = await apiClient.get("/audit/terrain/");
  return response.data;
};

export const createAuditTerrain = async (formData) => {
  const response = await apiClient.post("/audit/terrain/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const deleteAuditTerrain = async (id) => {
  const response = await apiClient.delete(`/audit/terrain/${id}/`);
  return response.data;
};