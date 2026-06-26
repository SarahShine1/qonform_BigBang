export function normalizeRoleLabel(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

const ROLE_DISPLAY_LABELS = {
  PILOTE: "Gestionnaire de processus",
  "PILOTE DE PROCESSUS": "Gestionnaire de processus",
};

export function getRoleDisplayLabel(role) {
  const normalizedRole = normalizeRoleLabel(role);
  return ROLE_DISPLAY_LABELS[normalizedRole] || String(role || "").trim();
}

export function formatRoleLabels(roles = []) {
  return roles
    .map((role) => getRoleDisplayLabel(role))
    .filter(Boolean);
}
