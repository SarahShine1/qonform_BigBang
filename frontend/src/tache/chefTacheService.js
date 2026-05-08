import { mockTachesChef } from "./mockTachesChef";

const API_URL = "http://127.0.0.1:8000/api/v1/taches/";

export async function getTachesPlanifieesChef() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Erreur lors du chargement des tâches");
    }

    return await response.json();
  } catch (error) {
    console.warn("Backend non disponible, utilisation des données mock.");
    return mockTachesChef;
  }
}

export async function createTachePlanifieeChef(tache) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tache),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la création de la tâche");
    }

    return await response.json();
  } catch (error) {
    console.warn("Backend non disponible, création locale temporaire.");

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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tache),
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la modification de la tâche");
    }

    return await response.json();
  } catch (error) {
    console.warn("Backend non disponible, modification locale temporaire.");

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
    });

    if (!response.ok) {
      throw new Error("Erreur lors de la suppression de la tâche");
    }

    return true;
  } catch (error) {
    console.warn("Backend non disponible, suppression locale temporaire.");
    return true;
  }
}