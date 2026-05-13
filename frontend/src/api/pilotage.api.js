import { apiClient } from "./auth";

export const pilotageApi = {
  getDashboard: async () => {
    const { data } = await apiClient.get("/pilotage/dashboard/");
    return data;
  },
};
