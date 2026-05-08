import { apiClient } from "./auth";

export const getProcessusList = () =>
  apiClient.get("/processus/").then((r) => r.data?.results ?? r.data);
