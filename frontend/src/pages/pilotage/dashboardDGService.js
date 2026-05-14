const API_URL = "http://127.0.0.1:8000/api/v1/pilotage/dashboard-dg/";

export async function getDashboardDG() {
  const token = localStorage.getItem("access_token");

  const response = await fetch(API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erreur chargement dashboard DG");
  }

  return response.json();
}