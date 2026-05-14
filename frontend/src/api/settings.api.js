import { apiClient } from "./auth";

export async function getMySettings() {
  const response = await apiClient.get("/auth/me/settings/");
  return response.data;
}

export async function updateMyProfile(payload) {
  const response = await apiClient.patch("/auth/me/settings/", payload);
  return response.data;
}

export async function uploadProfilePhoto(file) {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await apiClient.post("/auth/me/photo/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function changePassword(payload) {
  const response = await apiClient.post("/auth/me/change-password/", payload);
  return response.data;
}

export async function updatePreferences(payload) {
  const response = await apiClient.patch("/auth/me/preferences/", payload);
  return response.data;
}
