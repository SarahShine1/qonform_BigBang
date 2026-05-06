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

export function EmployeeTable({ employees = [], loading, canManage }) {
  const hasEmployees = employees.length > 0;

  return (
    <section className="rounded-xl border border-purple-100 bg-white text-left shadow-sm">
      <div className="flex items-center justify-between border-b border-purple-100 px-5 py-5">
        <h2 className="text-base font-semibold text-gray-900">Liste des employes</h2>
        {canManage && (
          <Button
            variant="outline"
            className="h-9 rounded-lg border-purple-700 px-4 text-sm text-purple-700 hover:bg-purple-50"
          >
            <Plus className="h-4 w-4" />
            Ajouter employe
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex min-h-[220px] items-center justify-center text-sm text-gray-400">
          Chargement des employes...
        </div>
      )}

      {!loading && !hasEmployees && (
        <div className="flex min-h-[220px] flex-col items-center justify-center text-center text-sm text-indigo-300">
          <Users className="mb-4 h-10 w-10 text-gray-300" />
          <p>Aucun employe enregistre. Ajoutez des employes pour les voir ici.</p>
        </div>
      )}

      {!loading && hasEmployees && (
        <div className="px-5 pb-5">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-100 hover:bg-transparent">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Nom &amp; Prenom
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Matricule
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Poste
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Departement
                </TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Statut
                </TableHead>
                {canManage && (
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow
                  key={employee.id_user}
                  className="border-b border-gray-50 hover:bg-gray-50/60"
                >
                  <TableCell className="py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {displayName(employee)}
                      </p>
                      <p className="text-xs text-gray-400">{employee.email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {employee.matricule}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">
                    {roleLabel(employee)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full border border-purple-100 bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
                      {employee.departement || "Non assigne"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        employee.est_actif
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {employee.est_actif ? "Actif" : "Inactif"}
                    </span>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
