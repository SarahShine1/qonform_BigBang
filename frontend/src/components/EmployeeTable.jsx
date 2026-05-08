import { Edit2, Plus, Trash2, Users } from "lucide-react";
import { Button } from "./ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/Table";

function displayName(employee) {
  return `${employee.prenom || ""} ${employee.nom || ""}`.trim();
}

function roleLabel(employee) {
  return employee.roles?.[0] || "Employe";
}

function departmentBadge(name = "") {
  const label = name.toLowerCase();
  if (label.includes("direction")) {
    return "border-purple-100 bg-purple-50 text-purple-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300";
  }
  if (label.includes("ressource") || label.includes("rh")) {
    return "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300";
  }
  if (label.includes("qualit") || label.includes("cq")) {
    return "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300";
  }
  if (label.includes("informat") || label.includes("it")) {
    return "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300";
  }
  if (label.includes("finance") || label.includes("fi")) {
    return "border-pink-100 bg-pink-50 text-pink-700 dark:border-pink-900 dark:bg-pink-950/50 dark:text-pink-300";
  }
  return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function employeeAssignment(employee, employeeAssignments) {
  return employeeAssignments?.[String(employee.id_user)] || null;
}

function departmentLabel(employee, assignment, unitLookup) {
  if (assignment?.unitName) return assignment.unitName;
  const unit = unitLookup?.[String(employee.departement)];
  return unit?.name || "Non assigne";
}

export function EmployeeTable({
  employees = [],
  loading,
  canManage,
  employeeAssignments = {},
  unitLookup = {},
}) {
  const hasEmployees = employees.length > 0;

  return (
    <section className="rounded-[20px] border border-purple-100 bg-white text-left shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-purple-100 px-4 py-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Liste des employes</h2>
        {canManage ? (
          <Button
            variant="outline"
            className="h-8 rounded-lg border-[#58148E] px-3.5 text-sm text-[#58148E] hover:bg-[#F7F1FC] dark:border-violet-700 dark:text-violet-300 dark:hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Ajouter employe
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-gray-400 dark:text-slate-500">
          Chargement des employes...
        </div>
      ) : null}

      {!loading && !hasEmployees ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center text-center text-sm text-indigo-300 dark:text-slate-500">
          <Users className="mb-4 h-9 w-9 text-gray-300 dark:text-slate-600" />
          <p>Aucun employe enregistre. Ajoutez des employes pour les voir ici.</p>
        </div>
      ) : null}

      {!loading && hasEmployees ? (
        <div className="px-4 pb-4">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100 hover:bg-transparent dark:border-slate-800">
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-slate-500">
                  Nom &amp; Prenom
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-slate-500">
                  Matricule
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-slate-500">
                  Poste
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-slate-500">
                  Departement
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-slate-500">
                  Statut
                </TableHead>
                {canManage ? (
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-slate-500">
                    Actions
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                const assignment = employeeAssignment(employee, employeeAssignments);
                const label = departmentLabel(employee, assignment, unitLookup);

                return (
                  <TableRow
                    key={employee.id_user}
                    className="border-b border-gray-50 hover:bg-gray-50/60 dark:border-slate-800 dark:hover:bg-slate-800/60"
                  >
                    <TableCell className="py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          {displayName(employee)}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-slate-500">{employee.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 dark:text-slate-400">
                      {employee.matricule}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700 dark:text-slate-300">
                      {assignment?.title || roleLabel(employee)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${departmentBadge(label)}`}
                      >
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                        {label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          employee.est_actif
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {employee.est_actif ? "Actif" : "Inactif"}
                      </span>
                    </TableCell>
                    {canManage ? (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button className="p-1 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-200">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </section>
  );
}
