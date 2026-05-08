/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";

const TYPE_LABELS = {
  ROOT: "Racine",
  DEPARTMENT: "Departement",
};

function flattenUnits(units, depth = 0) {
  return units.flatMap((unit) => [
    { ...unit, depth },
    ...flattenUnits(unit.children || [], depth + 1),
  ]);
}

function nextType(parent) {
  if (!parent) return "ROOT";
  if (parent.type === "ROOT") return "DEPARTMENT";
  if (parent.type === "DEPARTMENT") return "SERVICE";
  return "CELLULE";
}

function parentLabel(parent) {
  if (!parent) return "Aucun";
  return parent.name || TYPE_LABELS[parent.type] || "Selection";
}

export default function OrganizationUnitModal({
  open,
  mode,
  unit,
  parent,
  tree,
  employees,
  saving,
  error,
  onClose,
  onSubmit,
}) {
  const flatUnits = useMemo(() => flattenUnits(tree || []), [tree]);
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    name: "",
    type: "ROOT",
    parentId: "",
    responsableId: "",
    title: "",
    displayCode: "",
  });

  useEffect(() => {
    if (!open) return;

    if (isEdit && unit) {
      setForm({
        name: unit.name || "",
        type: unit.type || "ROOT",
        parentId: unit.parentId || "",
        responsableId: unit.responsableId || "",
        title: unit.title || "",
        displayCode: unit.displayCode || "",
      });
      return;
    }

    setForm({
      name: "",
      type: nextType(parent),
      parentId: parent?.id || "",
      responsableId: "",
      title: "",
      displayCode: "",
    });
  }, [open, isEdit, unit, parent]);

  if (!open) return null;

  const currentParent =
    parent ||
    flatUnits.find((item) => String(item.id) === String(form.parentId)) ||
    null;

  const handleChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      name: form.name.trim(),
      type: form.type,
      parentId: form.type === "ROOT" ? null : Number(form.parentId),
      responsableId: form.responsableId ? Number(form.responsableId) : null,
      title: form.title.trim(),
      displayCode: form.displayCode.trim().toUpperCase(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35 px-4 py-3 backdrop-blur-[2px] sm:px-6 sm:py-4">
      <div className="mx-auto flex h-full max-w-[720px] items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-[680px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_18px_50px_rgba(109,40,217,0.14)] dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5 dark:border-slate-800">
            <div>
              <h2 className="text-[17px] font-semibold text-slate-900 dark:text-slate-100">
                {isEdit ? "Modifier l'unite" : "Ajouter une unite"}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Edition rapide d&apos;un noeud sans ouvrir tout l&apos;organigramme.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-xs text-slate-600 sm:grid-cols-2 sm:px-5 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                Niveau
              </span>
              <span className="mt-0.5 block text-xs font-medium text-slate-800 dark:text-slate-100">
                {TYPE_LABELS[form.type] || "Unite"}
              </span>
            </div>

            <div className="rounded-xl border border-violet-100 bg-white px-3 py-2 dark:border-violet-900 dark:bg-slate-900">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                Parent
              </span>
              <span className="mt-0.5 block text-xs font-medium text-slate-800 dark:text-slate-100">
                {parentLabel(currentParent)}
              </span>
            </div>
          </div>

          <div className="grid gap-3 px-4 py-3.5 sm:px-5">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1.15fr)_110px]">
              <label className="space-y-1">
                <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  Nom complet / Service
                </span>
                <input
                  value={form.name}
                  onChange={(event) => handleChange("name", event.target.value)}
                  minLength={3}
                  maxLength={120}
                  required
                  placeholder="Cellule Qualite"
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>

              <label className="space-y-1">
                <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  Poste / Titre
                </span>
                <input
                  value={form.title}
                  onChange={(event) => handleChange("title", event.target.value)}
                  maxLength={120}
                  required
                  placeholder="Chef Cellule Qualite"
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>

              <label className="space-y-1">
                <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  Code
                </span>
                <input
                  value={form.displayCode}
                  onChange={(event) =>
                    handleChange("displayCode", event.target.value.toUpperCase())
                  }
                  maxLength={20}
                  required
                  placeholder="CQ"
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
            </div>

            <label className="space-y-1">
              <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                Responsable
              </span>
              <select
                value={form.responsableId}
                onChange={(event) => handleChange("responsableId", event.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Non assigne</option>
                {employees.map((employee) => (
                  <option key={employee.id_user} value={employee.id_user}>
                    {employee.prenom} {employee.nom} - {employee.email}
                  </option>
                ))}
              </select>
            </label>

            {error && (
              <p className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:border-rose-950 dark:bg-rose-950/40">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-5 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-violet-200 px-4 text-xs font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300 dark:hover:bg-slate-800"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#58148E] px-4 text-xs font-semibold text-white transition hover:bg-[#4A1178] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? "Enregistrement..." : isEdit ? "Modifier" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}