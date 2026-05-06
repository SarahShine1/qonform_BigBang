import { apiClient } from "./auth";

export const organigramApi = {
  getTree: async () => {
    const { data } = await apiClient.get("/organigramme/tree/");
    return data;
  },
  getUnits: async () => {
    const { data } = await apiClient.get("/organigramme/units/");
    return data;
  },
  createUnit: async (payload) => {
    const { data } = await apiClient.post("/organigramme/units/", payload);
    return data;
  },
  updateUnit: async (id, payload) => {
    const { data } = await apiClient.patch(`/organigramme/units/${id}/`, payload);
    return data;
  },
  deleteUnit: async (id) => {
    await apiClient.delete(`/organigramme/units/${id}/`);
  },
  getEmployees: async () => {
    const { data } = await apiClient.get("/organigramme/employees/");
    return data;
  },
};

