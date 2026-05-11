import {
  BarChart3,
  Calendar,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FolderOpen,
  GitBranch,
  LayoutDashboard,
  Map,
  Network,
  Settings,
  Users,
} from "lucide-react";

const chefProjetItems = [
  { label: "Tableau de bord", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Organigramme", icon: GitBranch, to: "/organigramme" },
  {
    label: "Cartographie",
    icon: Map,
    children: [
      { label: "Canevas fiche", icon: FileText, to: "/cartographie/canevas-fiche" },
      { label: "Processus", icon: Network, to: "/cartographie/processus" },
      { label: "Interactions", icon: GitBranch, to: "/cartographie/interactions" },
    ],
  },
  {
    label: "Planif et suivi",
    icon: Calendar,
    children: [
      { label: "Planification", icon: Calendar, to: "/planification" },
      { label: "Suivi", icon: ClipboardList, to: "/suivi" },
    ],
  },
  { label: "Support documentaire", icon: FolderOpen, to: "/documents" },
  { label: "Niveau de maturité", icon: BarChart3, to: "/niveau-maturite" },
  { label: "Gestion des users", icon: Users, to: "/gestion-utilisateurs" },
  { label: "Paramètres", icon: Settings, to: "/parametres" },
];

const piloteItems = [
  { label: "Tableau de bord", icon: LayoutDashboard, to: "/dashboard-pilote" },
  { label: "Organigramme", icon: GitBranch, to: "/organigramme" },
  {
    label: "Cartographie",
    icon: Map,
    children: [
      { label: "Processus", icon: Network, to: "/cartographie/processus" },
      { label: "Interactions", icon: GitBranch, to: "/cartographie/interactions" },
    ],
  },
  {
    label: "Planif et suivi",
    icon: Calendar,
    children: [
      { label: "Planification", icon: Calendar, to: "/planification" },
      { label: "Suivi", icon: ClipboardList, to: "/suivi" },
    ],
  },
  { label: "Support documentaire", icon: FolderOpen, to: "/documents" },
  { label: "Niveau de maturité", icon: BarChart3, to: "/niveau-maturite" },
  { label: "Paramètres", icon: Settings, to: "/parametres" },
];

const auditeurItems = [
  { label: "Tableau de bord", icon: LayoutDashboard, to: "/dashboard-auditeur" },
  { label: "Organigramme", icon: GitBranch, to: "/organigramme" },
  {
    label: "Cartographie",
    icon: Map,
    children: [
      { label: "Processus", icon: Network, to: "/cartographie/processus" },
      { label: "Interactions", icon: GitBranch, to: "/cartographie/interactions" },
    ],
  },
  {
    label: "Audit",
    icon: ClipboardCheck,
    children: [
      { label: "Pré-audit", icon: FileText, to: "/audit/preaudit" },
      { label: "Mes audits", icon: ClipboardList, to: "/audit/mes-audits" },
      { label: "Audits terrain", icon: Map, to: "/audit/audits-terrain" },
    ],
  },
  {
    label: "Planif et suivi",
    icon: Calendar,
    children: [
      { label: "Planification", icon: Calendar, to: "/planification" },
      { label: "Suivi", icon: ClipboardList, to: "/suivi" },
    ],
  },
  { label: "Support documentaire", icon: FolderOpen, to: "/documents" },
  { label: "Niveau de maturité", icon: BarChart3, to: "/niveau-maturite" },
  { label: "Paramètres", icon: Settings, to: "/parametres" },
];

function normalizeRoles(roles = []) {
  return roles.map((role) =>
    String(role)
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  );
}

export function getSidebarItemsByRole(roles = []) {
  const normalizedRoles = normalizeRoles(roles);

  const isChefProjet =
    normalizedRoles.includes("CAQ") ||
    normalizedRoles.includes("ADMIN") ||
    normalizedRoles.includes("CHEF_PROJET") ||
    normalizedRoles.includes("CHEF DE PROJET") ||
    normalizedRoles.includes("CHEF CELLULE QUALITE");

  const isPilote =
    normalizedRoles.includes("PILOTE") ||
    normalizedRoles.includes("PILOTE DE PROCESSUS");

  const isAuditeur =
    normalizedRoles.includes("AUDITEUR") ||
    normalizedRoles.includes("AUDITEUR INTERNE");

  if (isChefProjet) return chefProjetItems;
  if (isPilote) return piloteItems;
  if (isAuditeur) return auditeurItems;

  return [
    { label: "Tableau de bord", icon: LayoutDashboard, to: "/dashboard" },
    { label: "Support documentaire", icon: FolderOpen, to: "/documents" },
    { label: "Paramètres", icon: Settings, to: "/parametres" },
  ];
}
