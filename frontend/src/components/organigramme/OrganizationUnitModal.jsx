/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const TYPES = [
  { value: "ROOT", label: "Racine" },
  { value: "DIRECTION", label: "Direction" },
  { value: "DEPARTMENT", label: "Departement" },
  { value: "SERVICE", label: "Service" },
  { value: "CELLULE", label: "Cellule" },
];

function flattenUnits(units, depth = 0) {
  return units.flatMap((unit) => [
    { ...unit, depth },
    ...flattenUnits(unit.children || [], depth + 1),
  ]);
}

function nextType(parent) {
  if (!parent) return "ROOT";
  if (parent.type === "ROOT") return "DIRECTION";
  if (parent.type === "DIRECTION") return "DEPARTMENT";
  if (parent.type === "DEPARTMENT") return "SERVICE";
  return "CELLULE";
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
    description: "",
  });

  useEffect(() => {
    if (!open) return;
    if (isEdit && unit) {
      setForm({
        name: unit.name || "",
        type: unit.type || "ROOT",
        parentId: unit.parentId || "",
        responsableId: unit.responsableId || "",
        description: unit.description || "",
      });
      return;
    }
    setForm({
      name: "",
      type: nextType(parent),
      parentId: parent?.id || "",
      responsableId: "",
      description: "",
    });
  }, [open, isEdit, unit, parent]);

  if (!open) return null;

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
      description: form.description.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-xl bg-white text-left shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-gray-100 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {isEdit ? "Modifier l'unite" : "Ajouter une unite"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Structure hierarchique de l'ESI
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Nom
            </label>
            <input
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
              minLength={3}
              maxLength={120}
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              placeholder="ex: Cellule Qualite"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                value={form.type}
                onChange={(event) => handleChange("type", event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              >
                {TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Parent
              </label>
              <select
                value={form.parentId}
                disabled={form.type === "ROOT"}
                onChange={(event) => handleChange("parentId", event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50"
              >
                <option value="">Aucun</option>
                {flatUnits
                  .filter((item) => item.id !== unit?.id)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {"--".repeat(item.depth)} {item.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Responsable
            </label>
            <select
              value={form.responsableId}
              onChange={(event) => handleChange("responsableId", event.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
            >
              <option value="">Non assigne</option>
              {employees.map((employee) => (
                <option key={employee.id_user} value={employee.id_user}>
                  {employee.prenom} {employee.nom} - {employee.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) => handleChange("description", event.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-100"
              placeholder="Description courte"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-purple-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-purple-800 disabled:opacity-60"
          >
            {saving ? "Enregistrement..." : isEdit ? "Modifier" : "Creer"}
          </button>
        </div>
      </form>
    </div>
  );
}
