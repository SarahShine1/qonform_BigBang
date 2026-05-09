import { apiClient } from "./auth";

export const messagingApi = {
  getContacts: async () => {
    const { data } = await apiClient.get("/messaging/contacts/");
    return data;
  },
  getConversations: async () => {
    const { data } = await apiClient.get("/messaging/conversations/");
    return data;
  },
  getMessages: async (conversationId) => {
    const { data } = await apiClient.get(`/messaging/conversations/${conversationId}/messages/`);
    return data;
  },
  sendMessage: async (payload) => {
    const { data } = await apiClient.post("/messaging/messages/", payload);
    return data;
  },
};

