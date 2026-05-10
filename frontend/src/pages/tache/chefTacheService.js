import { mockTachesChef } from "./mockTachesChef";

const API_URL = "http://127.0.0.1:8000/api/v1/taches/";
const USERS_API_URL = "http://127.0.0.1:8000/api/v1/auth/users/";
console.log("USERS_API_URL =", USERS_API_URL);
function getAccessToken() {
  const simpleKeys = [
    "access",
    "accessToken",
    "token",
    "authToken",
    "jwt",
    "access_token",
  ];

  for (const key of simpleKeys) {
    const value = localStorage.getItem(key);
    if (value) return value;
  }

  const objectKeys = ["authTokens", "tokens", "auth", "user"];

  for (const key of objectKeys) {
    const value = localStorage.getItem(key);

    if (value) {
      try {
        const parsed = JSON.parse(value);

        return (
          parsed.access ||
          parsed.accessToken ||
          parsed.token ||
          parsed.jwt ||
          parsed.access_token ||
          null
        );
      } catch {
        return null;
      }
    }
  }

  return null;
}

function getAuthHeaders() {
  const token = getAccessToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeList(data) {
  return data.results || data;
}

function normalizeUserFromBackend(user) {
  return {
    id:
      user.id_user ||
      user.utilisateur_id ||
      user.profile_id ||
      user.id,

    nom:
      user.nom ||
      user.last_name ||
      "",

    prenom:
      user.prenom ||
      user.first_name ||
      user.username ||
      "",

    email: user.email || "",
  };
}

function normalizeTacheFromBackend(tache) {
  return {
    id: tache.id_tache || tache.id,

    intitule: tache.intitule || "",
    description: tache.description || "",

    type: tache.type_tache || tache.type || "",

    responsable:
      tache.responsable ||
      tache.id_responsable ||
      "",

    responsableNom:
      tache.responsable_nom ||
      tache.responsable_display ||
      tache.responsable_name ||
      "",

    createur:
      tache.createur ||
      tache.id_createur ||
      "",

    dateDebut: tache.date_debut || tache.dateDebut || "",
    dateFin: tache.date_fin || tache.dateFin || "",

    priorite: tache.priorite || "Moyenne",
    statut: tache.statut || "Planifiée",
    observations: tache.observations || "",
  };
}

function normalizeTacheToBackend(tache) {
  return {
    intitule: tache.intitule,
    description: tache.description,
    type_tache: tache.type,

    responsable: Number(tache.responsable),

    createur: Number(tache.createur || tache.responsable),

    date_debut: tache.dateDebut,
    date_fin: tache.dateFin,

    priorite: tache.priorite || "Moyenne",
    statut: tache.statut || "Planifiée",
    observations: tache.observations,
  };
}

export async function getUtilisateurs() {
  try {
    const response = await fetch(USERS_API_URL, {
      headers: getAuthHeaders(),
    });

    console.log("STATUS USERS:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur users:", errorText);
      throw new Error("Erreur lors du chargement des utilisateurs");
    }

    const data = await response.json();
    console.log("USERS DATA:", data);

    const users = normalizeList(data)
      .map(normalizeUserFromBackend)
      .filter((user) => user.id);

    return users.sort((a, b) => {
      const nomA = `${a.nom} ${a.prenom}`.toLowerCase();
      const nomB = `${b.nom} ${b.prenom}`.toLowerCase();
      return nomA.localeCompare(nomB);
    });
  } catch (error) {
    console.warn("Backend utilisateurs non disponible.", error);
    return [];
  }
}

export async function getTachesPlanifieesChef() {
  try {
    const response = await fetch(API_URL, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Erreur lors du chargement des tâches");
    }

    const data = await response.json();

    return normalizeList(data).map(normalizeTacheFromBackend);
  } catch (error) {
    console.warn("Backend non disponible, utilisation des données mock.", error);
    return mockTachesChef;
  }
}

export async function createTachePlanifieeChef(tache) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(normalizeTacheToBackend(tache)),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur création tâche:", errorText);
      throw new Error("Erreur lors de la création de la tâche");
    }

    const data = await response.json();
    return normalizeTacheFromBackend(data);
  } catch (error) {
    console.warn("Backend non disponible, création locale temporaire.", error);

    return {
      ...tache,
      id: Date.now(),
      statut: tache.statut || "Planifiée",
    };
  }
}

export async function updateTachePlanifieeChef(id, tache) {
  try {
    const response = await fetch(`${API_URL}${id}/`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(normalizeTacheToBackend(tache)),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur modification tâche:", errorText);
      throw new Error("Erreur lors de la modification de la tâche");
    }

    const data = await response.json();
    return normalizeTacheFromBackend(data);
  } catch (error) {
    console.warn("Backend non disponible, modification locale temporaire.", error);

    return {
      ...tache,
      id,
    };
  }
}

export async function deleteTachePlanifieeChef(id) {
  try {
    const response = await fetch(`${API_URL}${id}/`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la suppression de la tâche");
    }

    return true;
  } catch (error) {
    console.warn("Backend non disponible, suppression locale temporaire.", error);
    return true;
  }
}