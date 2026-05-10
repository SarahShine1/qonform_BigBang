import { apiClient } from "./auth";

export const fetchProcesses = async () => {
  const { data } = await apiClient.get("/processus/");
  return data?.results ?? data;
};

export const createProcess = async (payload) => {
  const { data } = await apiClient.post("/processus/", payload);
  return data;
};

export const deleteProcess = async (id) => {
  await apiClient.delete(`/processus/${id}/`);
};

export const fetchOrganigrammeDepartments = async () => {
  const { data } = await apiClient.get("/organigramme/tree/");
  return data;
};
