import { Edit2, Plus, Trash2, Users } from "lucide-react";
import { Button } from "./ui/Button";

const badgeClasses = {
  ROOT: "bg-purple-100 text-purple-700",
  DIRECTION: "bg-violet-100 text-violet-700",
  DEPARTMENT: "bg-emerald-100 text-emerald-700",
  SERVICE: "bg-blue-100 text-blue-700",
  CELLULE: "bg-amber-100 text-amber-700",
};

const borderClasses = {
  ROOT: "border-purple-500",
  DIRECTION: "border-violet-300",
  DEPARTMENT: "border-emerald-300",
  SERVICE: "border-blue-300",
  CELLULE: "border-amber-300",
};

function initialsFor(unit) {
  if (unit.code) return unit.code.split("-")[0].slice(0, 4);
  return unit.type?.slice(0, 3) || "ORG";
}

function personName(unit) {
  if (!unit.responsable) return "Responsable non assigne";
  return `${unit.responsable.prenom} ${unit.responsable.nom}`;
}

function OrgNode({ unit, canManage, onCreate, onEdit, onDelete }) {
  const children = unit.children || [];

  return (
    <div className="flex flex-col items-center">
      <div
        className={`group relative min-w-[158px] rounded-lg border-2 bg-white px-5 py-4 text-center shadow-sm ${
          borderClasses[unit.type] || "border-gray-200"
        }`}
      >
        <p className="text-sm font-semibold text-gray-900">{unit.name}</p>
        <p className="mt-1 text-xs text-gray-400">{personName(unit)}</p>
        <span
          className={`mt-2 inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${
            badgeClasses[unit.type] || "bg-gray-100 text-gray-600"
          }`}
        >
          {initialsFor(unit)}
        </span>

        {canManage && (
          <div className="absolute -right-3 -top-3 hidden gap-1 group-hover:flex">
            <button
              type="button"
              onClick={() => onCreate(unit)}
              className="rounded-full border border-gray-200 bg-white p-1.5 text-purple-700 shadow-sm hover:bg-purple-50"
              title="Ajouter"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onEdit(unit)}
              className="rounded-full border border-gray-200 bg-white p-1.5 text-gray-500 shadow-sm hover:bg-gray-50"
              title="Modifier"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(unit)}
              className="rounded-full border border-gray-200 bg-white p-1.5 text-red-500 shadow-sm hover:bg-red-50"
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {children.length > 0 && (
        <>
          <div className="h-7 w-px bg-gray-300" />
          <div className="flex items-start justify-center gap-5">
            {children.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center">
                <div className="mb-7 h-7 w-px bg-gray-300" />
                <OrgNode
                  unit={child}
                  canManage={canManage}
                  onCreate={onCreate}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function OrgChart({
  tree = [],
  loading,
  error,
  canManage,
  onCreate,
  onEdit,
  onDelete,
}) {
  const hasTree = tree.length > 0;

  return (
    <section className="bg-white px-5 pb-10 pt-4 text-left">
      <div className="mb-10 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">
          Structure organisationnelle
        </h2>
        {canManage && (
          <Button
            onClick={() => onCreate(null)}
            className="h-9 rounded-lg bg-purple-700 px-4 text-sm text-white hover:bg-purple-800"
          >
            <Plus className="h-4 w-4" />
            Creer l'organigramme
          </Button>
        )}
      </div>

      {loading && (
        <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-purple-100 text-sm text-gray-400">
          Chargement de l'organigramme...
        </div>
      )}

      {!loading && error && (
        <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-red-100 bg-red-50 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && !hasTree && (
        <div className="flex min-h-[324px] flex-col items-center justify-center rounded-xl border border-dashed border-purple-100 text-center text-sm text-indigo-300">
          <Users className="mb-4 h-10 w-10 text-gray-300" />
          <p>
            L'organigramme est vide. Cliquez sur{" "}
            <span className="font-semibold text-indigo-400">
              Creer l'organigramme
            </span>{" "}
            pour commencer.
          </p>
        </div>
      )}

      {!loading && !error && hasTree && (
        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max justify-center py-8">
            {tree.map((root) => (
              <OrgNode
                key={root.id}
                unit={root}
                canManage={canManage}
                onCreate={onCreate}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
