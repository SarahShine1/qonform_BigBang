import { apiClient } from "./auth";

export const pvApi = {
  /**
   * Get list of all PVs with optional filters
   * @param {Object} params - Query parameters
   * @param {string} params.type - Filter by type (AUDIT, SUIVI, MEETING)
   * @param {string} params.date - Filter by specific date
   * @param {number} params.page - Page number for pagination
   * @returns {Promise<Object>} Paginated PV list
   */
  getPVs: async (params = {}) => {
    const { data } = await apiClient.get("/pv/", { params });
    return data;
  },

  /**
   * Get a specific PV by ID
   * @param {number} id - PV ID
   * @returns {Promise<Object>} PV details
   */
  getPVById: async (id) => {
    const { data } = await apiClient.get(`/pv/${id}/`);
    return data;
  },

  /**
   * Create a new PV with file upload
   * @param {Object} payload - PV data
   * @param {string} payload.type - PV type (AUDIT, SUIVI, MEETING)
   * @param {string} payload.date - PV date (YYYY-MM-DD)
   * @param {number[]} payload.participants - Array of User IDs
   * @param {File} payload.fichier - PDF file
   * @returns {Promise<Object>} Created PV
   */
  createPV: async (payload) => {
    const formData = new FormData();
    formData.append("type", payload.type);
    formData.append("date", payload.date);
    
    // Append participants
    if (Array.isArray(payload.participants)) {
      payload.participants.forEach((id) => {
        formData.append("participants", id);
      });
    }
    
    // Append file
    if (payload.fichier instanceof File) {
      formData.append("fichier", payload.fichier);
    }

    const { data } = await apiClient.post("/pv/", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },

  /**
   * Update an existing PV
   * @param {number} id - PV ID
   * @param {Object} payload - Updated PV data
   * @param {string} payload.date - PV date (optional)
   * @param {number[]} payload.participants - Array of User IDs (optional)
   * @returns {Promise<Object>} Updated PV
   */
  updatePV: async (id, payload) => {
    const { data } = await apiClient.patch(`/pv/${id}/`, payload);
    return data;
  },

  /**
   * Delete a PV
   * @param {number} id - PV ID
   * @returns {Promise<void>}
   */
  deletePV: async (id) => {
    await apiClient.delete(`/pv/${id}/`);
  },

  /**
   * Get PVs filtered by type
   * @param {string} type - PV type (AUDIT, SUIVI, MEETING)
   * @returns {Promise<Object>} Filtered PV list
   */
  getPVsByType: async (type) => {
    const { data } = await apiClient.get("/pv/by-type/", {
      params: { type },
    });
    return data;
  },

  /**
   * Get PVs within a date range
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @returns {Promise<Object>} PV list
   */
  getPVsByDateRange: async (startDate, endDate) => {
    const { data } = await apiClient.get("/pv/by-date/", {
      params: { start_date: startDate, end_date: endDate },
    });
    return data;
  },

  /**
   * Get PV statistics
   * @returns {Promise<Object>} Statistics data
   */
  getPVStatistics: async () => {
    const { data } = await apiClient.get("/pv/statistics/");
    return data;
  },

  /**
   * Get participants for a specific PV
   * @param {number} id - PV ID
   * @returns {Promise<Object>} Participants data
   */
  getPVParticipants: async (id) => {
    const { data } = await apiClient.get(`/pv/${id}/participants/`);
    return data;
  },
};
