import { apiClient } from "./auth";

export async function askAssistant(payload) {
  const response = await apiClient.post("/assistant/query/", payload);
  return response.data;
}

