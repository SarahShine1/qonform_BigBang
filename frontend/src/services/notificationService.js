import { apiClient } from "../api/auth";

export async function getNotifications() {
  const { data } = await apiClient.get("/notifications/");
  return data;
}

export async function markNotificationAsRead(id) {
  const { data } = await apiClient.patch(`/notifications/${id}/lue/`);
  return data;
}
