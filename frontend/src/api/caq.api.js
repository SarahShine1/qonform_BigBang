 
import { apiClient } from "./auth";
 
export const caqApi = {
  /**
   * Récupère toutes les métriques du Dashboard CAQ.
   * GET /api/v1/pilotage/caq/dashboard/
   *
   * Retourne :
   *   { kpis, ficheStatus, processusByType, tasksDistribution, departmentStatus }
   */
  getDashboard: async () => {
    const { data } = await apiClient.get("/pilotage/caq/dashboard/");
    return data;
  },
};