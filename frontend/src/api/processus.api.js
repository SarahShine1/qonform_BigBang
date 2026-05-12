import { apiClient } from "./auth";

export const getProcessusList = (params = {}) =>
  apiClient.get("/processus/", { params }).then((r) => r.data?.results ?? r.data);
