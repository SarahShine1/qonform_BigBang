const API_URL = "http://127.0.0.1:8000/api/v1/notifications/";

function getToken() {
  return localStorage.getItem("access_token");
}

export async function getNotifications() {
  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) throw new Error("Erreur notifications");

  return response.json();
}

export async function markNotificationAsRead(id) {
  const response = await fetch(`${API_URL}${id}/lue/`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) throw new Error("Erreur marquage notification");

  return response.json();
}