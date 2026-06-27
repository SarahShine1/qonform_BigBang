import { apiClient } from "./auth";
import { fetchDocuments } from "./documents";

function normalizeTask(task) {
  return {
    id: task.id_tache || task.id,
    intitule: task.intitule || "",
    description: task.description || "",
    type: task.type_tache || task.type || "",
    responsable: task.responsable || task.id_responsable || null,
    responsableNom:
      task.responsable_nom ||
      task.responsable_display ||
      task.responsable_name ||
      "",
    createur: task.createur || task.id_createur || null,
    createurNom: task.createur_nom || "",
    dateDebut: task.date_debut || task.dateDebut || "",
    dateFin: task.date_fin || task.dateFin || "",
    priorite: task.priorite || "Moyenne",
    statut: task.statut || "Planifiee",
    observations: task.observations || "",
  };
}

export async function fetchAccueilTasks() {
  const { data } = await apiClient.get("/taches/");
  const list = Array.isArray(data) ? data : data?.results || [];
  return list.map(normalizeTask);
}

export async function fetchAccueilResources() {
  const data = await fetchDocuments({ page: 1, page_size: 4 });
  return {
    items: data?.results || [],
    pagination: data?.pagination || null,
  };
}
