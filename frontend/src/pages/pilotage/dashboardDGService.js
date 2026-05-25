import { getStoredAccessToken, clearAuth } from "../../utils/authStorage";

const API_URL = "http://127.0.0.1:8000/api/v1/pilotage/dashboard-dg/";

export async function getDashboardDG() {
  const token = getStoredAccessToken();

  if (!token) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("No access token - redirecting to login");
  }

  const response = await fetch(API_URL, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Unauthorized - redirecting to login");
  }

  if (!response.ok) {
    throw new Error("Erreur chargement dashboard DG");
  }

  return response.json();
}