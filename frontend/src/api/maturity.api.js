import { apiClient } from "./auth";

export async function getMyMaturityAssessment() {
  const { data } = await apiClient.get("/maturity/my-assessment/");
  return data;
}

export async function saveMyMaturityAssessment(payload) {
  const { data } = await apiClient.put("/maturity/my-assessment/", payload);
  return data;
}

