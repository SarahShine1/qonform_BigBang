import { apiClient } from "./auth";

export const getProcessusList = (params = {}) =>
  apiClient.get("/processus/", { params }).then((r) => r.data?.results ?? r.data);

export const getProcessusExternes = (search = "") =>
  apiClient
    .get("/processus/externes/", { params: search ? { search } : {} })
    .then((r) => r.data?.results ?? r.data);

export const createProcessusExterne = (nom) =>
  apiClient.post("/processus/externes/", { nom }).then((r) => r.data);
