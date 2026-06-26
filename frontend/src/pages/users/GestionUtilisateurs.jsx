import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Download,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { organigramApi } from "../../api/organigram.api";
import { usersApi } from "../../api/users.api";
import AppLayout from "../../components/layout/AppLayout";
import ConfirmationPopup from "../../components/template/ConfirmationPopup";
import CreateUserModal from "../../components/users/CreateUserModal";
import { useAuth } from "../../hooks/useAuth";
import { getRoleDisplayLabel } from "../../utils/roles";

const defaultStats = {
  activeUsers: 0,
  pilotes: 0,
  auditeurs: 0,
  disabledUsers: 0,
};

const statCards = [
  {
    label: "UTILISATEURS ACTIFS",
    statKey: "activeUsers",
    icon: Users,
    iconClassName:
      "bg-[#f2ebff] text-[#6d28d9] dark:bg-violet-950 dark:text-violet-300",
    accent: "from-emerald-200 via-cyan-100 to-white",
  },
  {
    label: "GESTIONNAIRES DE PROCESSUS",
    statKey: "pilotes",
    icon: Settings2,
    iconClassName:
      "bg-[#eef4ff] text-[#2563eb] dark:bg-blue-950 dark:text-blue-300",
  },
  {
    label: "AUDITEURS INTERNES",
    statKey: "auditeurs",
    icon: ShieldCheck,
    iconClassName:
      "bg-[#fff2e8] text-[#ea580c] dark:bg-orange-950 dark:text-orange-300",
  },
  {
    label: "COMPTES DESACTIVES",
    statKey: "disabledUsers",
    icon: UserX,
    iconClassName:
      "bg-[#fff1f2] text-[#e11d48] dark:bg-rose-950 dark:text-rose-300",
  },
];

function getStatusClasses(statut) {
  if (statut === "Actif") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900";
  }

  if (statut === "Inactif") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900";
  }

  return "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-900";
}

function apiErrorMessage(error) {
  const data = error?.response?.data;

  if (!data) return "Une erreur est survenue.";
  if (typeof data.detail === "string") return data.detail;
  if (typeof data === "string") return data;

  return Object.entries(data)
    .map(([field, value]) =>
      `${field}: ${Array.isArray(value) ? value.join(", ") : value}`,
    )
    .join(" ");
}

function normalizeFilterText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function escapeCsvValue(value) {
  const normalized = String(value ?? "").replace(/"/g, "\"\"");
  return `"${normalized}"`;
}

function getUnitId(unit) {
  return (
    unit?.id ??
    unit?.id_unit ??
    unit?.id_unite ??
    unit?.id_departement ??
    unit?.id_organisation ??
    unit?.id_organigramme ??
    ""
  );
}

function getUnitName(unit) {
  return (
    unit?.name ??
    unit?.nom ??
    unit?.libelle ??
    unit?.title ??
    unit?.label ??
    "Unite sans nom"
  );
}

function getUnitCode(unit) {
  return (
    unit?.code ??
    unit?.displayCode ??
    unit?.display_code ??
    unit?.sigle ??
    unit?.abreviation ??
    ""
  );
}

function getUnitType(unit) {
  return String(unit?.type ?? unit?.unit_type ?? unit?.niveau ?? "").toUpperCase();
}

function getUnitChildren(unit) {
  return unit?.children ?? unit?.enfants ?? unit?.childrens ?? unit?.nodes ?? [];
}

function flattenOrgUnits(units = [], parentName = "") {
  if (!Array.isArray(units)) return [];

  return units.flatMap((unit) => {
    const id = getUnitId(unit);
    const name = getUnitName(unit);
    const type = getUnitType(unit);
    const code = getUnitCode(unit);

    const normalized = {
      ...unit,
      id,
      name,
      type,
      code,
      parentName,
    };

    return [normalized, ...flattenOrgUnits(getUnitChildren(unit), name)];
  });
}

function isAssignableDepartment(unit) {
  return ["DIRECTION", "DEPARTMENT", "DEPARTEMENT", "SERVICE", "CELLULE"].includes(
    String(unit.type || "").toUpperCase(),
  );
}

function normalizeDepartmentOptions(treeOrUnits = []) {
  return flattenOrgUnits(Array.isArray(treeOrUnits) ? treeOrUnits : [])
    .filter((unit) => unit.id)
    .filter(isAssignableDepartment)
    .map((unit) => ({
      id: unit.id,
      name: unit.parentName ? `${unit.name} - ${unit.parentName}` : unit.name,
      code: unit.code,
      type: unit.type,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

function extractArrayFromApiResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.units)) return response.units;
  if (Array.isArray(response?.tree)) return response.tree;

  return [];
}

async function loadOrganigramDepartments() {
  try {
    let data = [];

    if (typeof organigramApi.getTree === "function") {
      data = await organigramApi.getTree();
    } else if (typeof organigramApi.getOrganigramme === "function") {
      data = await organigramApi.getOrganigramme();
    } else if (typeof organigramApi.getUnits === "function") {
      data = await organigramApi.getUnits();
    } else if (typeof organigramApi.list === "function") {
      data = await organigramApi.list();
    } else if (typeof organigramApi.getAll === "function") {
      data = await organigramApi.getAll();
    }

    return normalizeDepartmentOptions(extractArrayFromApiResponse(data));
  } catch (error) {
    console.error("Impossible de charger les departements depuis l'organigramme:", error);
    return [];
  }
}

function buildDepartmentLookup(departments = []) {
  return Object.fromEntries(
    departments.map((department) => [
      String(department.id),
      department.code
        ? `${department.name} (${department.code})`
        : department.name,
    ]),
  );
}

function normalizeUser(entry, departmentLookup = {}) {
  const role = getRoleDisplayLabel(entry.roles?.[0] || "Sans role");
  const departmentId = entry.departement ?? entry.id_departement ?? null;
  const departmentName = departmentId ? departmentLookup[String(departmentId)] : "";

  return {
    id: entry.id_user,
    nom: entry.full_name || `${entry.prenom || ""} ${entry.nom || ""}`.trim(),
    email: entry.email,
    telephone: entry.telephone || "-",
    role,
    service: departmentName || (departmentId ? `Departement ${departmentId}` : "Non assigne"),
    statut: entry.statut || (entry.est_actif ? "Actif" : "Desactive"),
    derniereConnexion: "-",
  };
}

export default function GestionUtilisateurs() {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [createNotice, setCreateNotice] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [pendingDeletion, setPendingDeletion] = useState(null);

  const userName =
    `${user?.prenom || ""} ${user?.nom || ""}`.trim() ||
    user?.email ||
    "Ahmed BENALI";

  const userRole = user?.roles?.[0] || "Chef Cellule Qualite";

  const roleOptions = useMemo(() => {
    const source = roles.length
      ? roles.map((role) => getRoleDisplayLabel(role?.libelle || role?.label || role?.name || ""))
      : users.map((entry) => entry.role);

    return Array.from(new Set(source.filter(Boolean))).sort((a, b) => a.localeCompare(b, "fr"));
  }, [roles, users]);

  const serviceOptions = useMemo(() => {
    return Array.from(new Set(users.map((entry) => entry.service).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "fr"),
    );
  }, [users]);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      setLoading(true);
      setError("");

      try {
        const [usersData, statsData, rolesData, departmentsData] = await Promise.all([
          usersApi.getUsers(),
          usersApi.getStats(),
          usersApi.getRoles(),
          loadOrganigramDepartments(),
        ]);

        if (!active) return;

        const departmentLookup = buildDepartmentLookup(departmentsData);
        setDepartments(departmentsData);
        setUsers(usersData.map((entry) => normalizeUser(entry, departmentLookup)));
        setStats({ ...defaultStats, ...statsData });
        setRoles(rolesData);
      } catch (loadError) {
        if (!active) return;
        setError(apiErrorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const term = normalizeFilterText(search);

    return users.filter((entry) => {
      const matchesSearch =
        !term ||
        [entry.nom, entry.email, entry.role, entry.service].some((value) =>
          normalizeFilterText(value).includes(term),
        );

      const matchesRole = !selectedRole || entry.role === selectedRole;
      const matchesService = !selectedService || entry.service === selectedService;

      return matchesSearch && matchesRole && matchesService;
    });
  }, [search, selectedRole, selectedService, users]);

  const handleCreateUser = async (payload) => {
    setSubmitting(true);
    setCreateError("");
    setCreateNotice("");

    try {
      const createdUser = await usersApi.createUser(payload);
      const departmentLookup = buildDepartmentLookup(departments);

      setUsers((current) => [normalizeUser(createdUser, departmentLookup), ...current]);
      setModalOpen(false);
      setCreateNotice(
        createdUser.email_sent
          ? ""
          : "Utilisateur cree avec succes, sans envoi d'email.",
      );

      const freshStats = await usersApi.getStats();
      setStats({ ...defaultStats, ...freshStats });
    } catch (createRequestError) {
      const partialUser = createRequestError?.response?.data?.user;

      if (partialUser) {
        const departmentLookup = buildDepartmentLookup(departments);

        setUsers((current) => [normalizeUser(partialUser, departmentLookup), ...current]);
        setModalOpen(false);
        setCreateError("");
        setCreateNotice(apiErrorMessage(createRequestError));

        try {
          const freshStats = await usersApi.getStats();
          setStats({ ...defaultStats, ...freshStats });
        } catch (statsError) {
          console.error("Impossible de rafraichir les statistiques:", statsError);
        }

        return;
      }

      setCreateError(apiErrorMessage(createRequestError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!pendingDeletion) return;

    setDeletingUserId(pendingDeletion.id);
    setDeleteError("");

    try {
      await usersApi.deleteUser(pendingDeletion.id);
      setUsers((current) =>
        current.map((entry) =>
          entry.id === pendingDeletion.id
            ? { ...entry, statut: "Desactive" }
            : entry,
        ),
      );
      setPendingDeletion(null);

      const freshStats = await usersApi.getStats();
      setStats({ ...defaultStats, ...freshStats });
    } catch (deleteRequestError) {
      setDeleteError(apiErrorMessage(deleteRequestError));
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleExportUsers = () => {
    const headers = [
      "Utilisateur",
      "Email",
      "Role",
      "Service",
      "Telephone",
      "Statut",
      "Derniere connexion",
    ];

    const rows = filteredUsers.map((entry) => [
      entry.nom,
      entry.email,
      entry.role,
      entry.service,
      entry.telephone,
      entry.statut,
      entry.derniereConnexion,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((value) => escapeCsvValue(value)).join(";"))
      .join("\n");

    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `utilisateurs-${stamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout
      pageTitle="Gestion utilisateurs"
      userName={userName}
      userRole={userRole}
    >
      <div className="space-y-4">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.label}
                className="relative overflow-hidden rounded-[18px] border border-slate-200 bg-white px-4 py-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-colors dark:border-slate-800 dark:bg-slate-900"
              >
                {card.accent ? (
                  <div
                    className={`absolute right-3 top-3 h-4 w-10 rounded-full bg-gradient-to-r ${card.accent} opacity-90`}
                  />
                ) : null}

                <div
                  className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${card.iconClassName}`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </div>

                <p className="text-[11px] font-semibold tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  {card.label}
                </p>

                <p className="mt-1.5 text-[28px] font-bold leading-none tracking-[-0.04em] text-slate-900 dark:text-slate-100">
                  {stats[card.statKey] ?? 0}
                </p>
              </article>
            );
          })}
        </section>

        <section className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-colors dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-1 flex-col gap-3 lg:flex-row">
              <label className="relative min-w-0 flex-1 lg:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Rechercher par nom ou email"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#58148E] focus:ring-4 focus:ring-[#ede9fe] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-500"
                />
              </label>

              <select
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 outline-none transition focus:border-[#58148E] focus:ring-4 focus:ring-[#ede9fe] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                aria-label="Filtrer par role"
              >
                <option value="">Tous les roles</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>

              <select
                value={selectedService}
                onChange={(event) => setSelectedService(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 outline-none transition focus:border-[#58148E] focus:ring-4 focus:ring-[#ede9fe] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                aria-label="Filtrer par service"
              >
                <option value="">Tous les services</option>
                {serviceOptions.map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleExportUsers}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Download className="h-4 w-4" />
                Exporter liste
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <BadgeCheck className="h-4 w-4" />
                Gerer les roles
              </button>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#58148E] px-4 py-2 text-sm font-medium text-white shadow-[0_8px_18px_rgba(88,20,142,0.25)] transition hover:bg-[#4A1178]"
              >
                <UserPlus className="h-4 w-4" />
                Creer utilisateur
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          ) : null}

          {createNotice ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
              {createNotice}
            </div>
          ) : null}

          {deleteError ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {deleteError}
            </div>
          ) : null}

          <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-950/60">
                  <tr>
                    {[
                      "Utilisateur",
                      "Role",
                      "Service",
                      "Telephone",
                      "Statut",
                      "Derniere connexion",
                      "Actions",
                    ].map((label) => (
                      <th
                        key={label}
                        className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                      >
                        Chargement des utilisateurs...
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((entry) => (
                      <tr
                        key={entry.id}
                        className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f2ebff] text-sm font-semibold text-[#6d28d9] dark:bg-violet-950 dark:text-violet-300">
                              {entry.nom
                                .split(" ")
                                .slice(0, 2)
                                .map((chunk) => chunk[0] || "")
                                .join("")}
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {entry.nom}
                              </p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {entry.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                          {entry.role}
                        </td>

                        <td className="px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                          {entry.service}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 text-sm text-slate-600 dark:text-slate-300">
                          {entry.telephone}
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(entry.statut)}`}
                          >
                            {entry.statut}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                          {entry.derniereConnexion}
                        </td>

                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => setPendingDeletion(entry)}
                            disabled={
                              deletingUserId === entry.id ||
                              entry.id === user?.id_user ||
                              entry.statut === "Desactive"
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30"
                            title={
                              entry.id === user?.id_user
                                ? "Vous ne pouvez pas supprimer votre propre compte."
                                : "Supprimer l'utilisateur"
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {deletingUserId === entry.id ? "Suppression..." : "Supprimer"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!loading && filteredUsers.length === 0 ? (
              <div className="border-t border-slate-200 px-5 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Aucun utilisateur ne correspond a cette recherche.
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <CreateUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateUser}
        roles={roles}
        departments={departments}
        submitting={submitting}
        error={createError}
      />

      {pendingDeletion ? (
        <ConfirmationPopup
          title="Supprimer cet utilisateur ?"
          message={`Le compte de ${pendingDeletion.nom} sera desactive et ne pourra plus se connecter.`}
          confirmLabel="Supprimer"
          onConfirm={handleDeleteUser}
          onCancel={() => {
            if (!deletingUserId) {
              setPendingDeletion(null);
            }
          }}
        />
      ) : null}
    </AppLayout>
  );
}
