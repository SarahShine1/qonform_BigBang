import { apiClient } from "./auth";

export async function getProcessInteractions() {
  const response = await apiClient.get("/processus/interactions/");
  return response.data;
}
