import { apiClient } from "./auth";

export const usersApi = {
  getUsers: async () => {
    const { data } = await apiClient.get("/auth/users/");
    return data;
  },
  getStats: async () => {
    const { data } = await apiClient.get("/auth/users/stats/");
    return data;
  },
  getRoles: async () => {
    const { data } = await apiClient.get("/auth/roles/");
    return data;
  },
  createUser: async (payload) => {
    const { data } = await apiClient.post("/auth/users/", payload);
    return data;
  },
};
