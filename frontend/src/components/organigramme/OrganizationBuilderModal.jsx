/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Check, Plus, X } from "lucide-react";

const MAX_DEPTH = 5;

const SECTION_COPY = [
  {
    eyebrow: "NOEUD RACINE (DIRECTION)",
    helper: "Definissez le point d'entree principal de la structure.",
  },
  {
    eyebrow: "DEPARTEMENT / POSTE",
    helper: "Ajoutez les entites rattachees directement a la direction.",
  },
  {
    eyebrow: "DEPARTEMENT / POSTE",
    helper: "Precisez les niveaux intermediaires sans alourdir la vue.",
  },
  {
    eyebrow: "DEPARTEMENT / POSTE",
    helper: "Renseignez les unites de dernier niveau lorsque necessaire.",
  },
];

const TYPE_BY_DEPTH = ["ROOT", "DEPARTMENT", "DEPARTMENT", "DEPARTMENT", "DEPARTMENT"];

function typeForDepth(depth) {
  return TYPE_BY_DEPTH[Math.min(depth, TYPE_BY_DEPTH.length - 1)];
}

function sectionForDepth(depth) {
  return SECTION_COPY[Math.min(depth, SECTION_COPY.length - 1)];
}

function createDraftNode(depth = 0) {
  return {
    tempId: `draft-${crypto.randomUUID()}`,
    id: null,
    type: typeForDepth(depth),
    name: "",
    title: "",
    displayCode: "",
    responsableId: "",
    children: [],
  };
}

function mapUnitToDraft(unit, depth = 0) {
  return {
    tempId: unit.id ? `unit-${unit.id}` : `draft-${crypto.randomUUID()}`,
    id: unit.id ?? null,
    type: unit.type || typeForDepth(depth),
    name: unit.name || "",
    title: unit.title || "",
    displayCode: unit.displayCode || "",
    responsableId: unit.responsableId || "",
    children: (unit.children || []).map((child) => mapUnitToDraft(child, depth + 1)),
  };
}

function replaceNode(nodes, tempId, updater) {
  return nodes.map((node) => {
    if (node.tempId === tempId) {
      return updater(node);
    }
    if (!node.children.length) {
      return node;
    }
    return {
      ...node,
      children: replaceNode(node.children, tempId, updater),
    };
  });
}

function removeNode(nodes, tempId) {
  return nodes
    .filter((node) => node.tempId !== tempId)
    .map((node) => ({
      ...node,
      children: removeNode(node.children, tempId),
    }));
}

function collectMissingField(nodes, depth = 0) {
  for (const node of nodes) {
    const label = depth === 0 ? "le noeud racine" : `le noeud ${node.name || node.displayCode || ""}`.trim();
    if (!node.name.trim()) return `Le nom complet est obligatoire pour ${label}.`;
    if (!node.title.trim()) return `Le poste / titre est obligatoire pour ${label}.`;
    if (!node.displayCode.trim()) return `Le code est obligatoire pour ${label}.`;
    const childMessage = collectMissingField(node.children, depth + 1);
    if (childMessage) return childMessage;
  }
  return "";
}

function NodeCard({ node, depth, employees, onChange, onAddChild, onRemove }) {
  const section = sectionForDepth(depth);
  const canAddChild = depth < MAX_DEPTH;

  return (
    <div className={depth > 0 ? "relative pl-4 sm:pl-8" : ""}>
      {depth > 0 && (
        <>
          <div className="absolute left-1.5 top-0 h-full w-px bg-violet-100 sm:left-3.5" />
          <div className="absolute left-1.5 top-7 h-px w-3 bg-violet-100 sm:left-3.5 sm:w-4" />
        </>
      )}

      <div
        className={[
          "relative rounded-2xl border shadow-sm",
          depth === 0
            ? "border-violet-200 bg-violet-50/70"
            : "border-slate-200 bg-white",
        ].join(" ")}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3 sm:px-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-violet-700">
              {section.eyebrow}
            </p>
            <p className="mt-1 text-xs text-slate-500">{section.helper}</p>
          </div>
          {depth > 0 && (
            <button
              type="button"
              onClick={() => onRemove(node.tempId)}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-rose-500 transition hover:bg-rose-50"
            >
              <X className="h-3.5 w-3.5" />
              Supprimer
            </button>
          )}
        </div>

        <div className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1.1fr)_116px]">
          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-700">
              Nom complet / Service
            </span>
            <input
              value={node.name}
              onChange={(event) => onChange(node.tempId, "name", event.target.value)}
              placeholder="Cellule Qualite"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
          </label>

          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-700">
              Poste / Titre
            </span>
            <input
              value={node.title}
              onChange={(event) => onChange(node.tempId, "title", event.target.value)}
              placeholder="Chef Cellule Qualite"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
          </label>

          <label className="space-y-1.5">
            <span className="block text-xs font-semibold text-slate-700">Code</span>
            <input
              value={node.displayCode}
              onChange={(event) => onChange(node.tempId, "displayCode", event.target.value.toUpperCase())}
              placeholder="CQ"
              maxLength={20}
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm uppercase text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            />
          </label>

          <label className="space-y-1.5 md:col-span-3">
            <span className="block text-xs font-semibold text-slate-700">Responsable</span>
            <select
              value={node.responsableId}
              onChange={(event) => onChange(node.tempId, "responsableId", event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-100"
            >
              <option value="">Non assigne</option>
              {employees.map((employee) => (
                <option key={employee.id_user} value={employee.id_user}>
                  {employee.prenom} {employee.nom}
                </option>
              ))}
            </select>
          </label>
        </div>

        {(node.children.length > 0 || canAddChild) && (
          <div className="border-t border-slate-100 px-4 pb-4 pt-3 sm:px-5">
            <div className="space-y-3">
              {node.children.map((child) => (
                <NodeCard
                  key={child.tempId}
                  node={child}
                  depth={depth + 1}
                  employees={employees}
                  onChange={onChange}
                  onAddChild={onAddChild}
                  onRemove={onRemove}
                />
              ))}
            </div>

            {canAddChild && (
              <button
                type="button"
                onClick={() => onAddChild(node.tempId, depth + 1)}
                className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-dashed border-violet-300 px-3.5 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
              >
                <Plus className="h-4 w-4" />
                Ajouter un sous-noeud
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrganizationBuilderModal({
  open,
  tree,
  employees = [],
  saving,
  error,
  onClose,
  onSubmit,
}) {
  const [draftTree, setDraftTree] = useState([createDraftNode(0)]);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (tree?.length) {
      setDraftTree([mapUnitToDraft(tree[0], 0)]);
      setLocalError("");
      return;
    }

    const root = createDraftNode(0);
    root.children = [createDraftNode(1)];
    setDraftTree([root]);
    setLocalError("");
  }, [open, tree]);

  if (!open) return null;

  const handleChange = (tempId, field, value) => {
    setDraftTree((current) =>
      replaceNode(current, tempId, (node) => ({
        ...node,
        [field]: value,
      })),
    );
  };

  const handleAddChild = (tempId, depth) => {
    setDraftTree((current) =>
      replaceNode(current, tempId, (node) => ({
        ...node,
        children: [...node.children, createDraftNode(depth)],
      })),
    );
  };

  const handleRemove = (tempId) => {
    setDraftTree((current) => removeNode(current, tempId));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const message = collectMissingField(draftTree);
    if (message) {
      setLocalError(message);
      return;
    }
    setLocalError("");
    onSubmit(draftTree);
  };

  const totalNodes = draftTree.reduce(
    (count, node) => count + countNodes(node),
    0,
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/35 px-4 py-4 backdrop-blur-[2px] sm:px-6 sm:py-6">
      <div className="mx-auto flex h-full max-w-[960px] items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="flex max-h-full w-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(109,40,217,0.18)] dark:bg-slate-900"
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Creer / Modifier l&apos;organigramme
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Definissez la hierarchie de votre organisation.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-3 text-sm text-slate-600 sm:grid-cols-2 sm:px-7 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300">
            <div className="rounded-2xl border border-violet-100 bg-white px-4 py-3 dark:border-violet-900 dark:bg-slate-900">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">
                Structure
              </span>
              <span className="mt-1 block text-sm font-medium text-slate-800 dark:text-slate-100">
                {tree?.length ? "Edition de l'arborescence existante" : "Creation de la structure initiale"}
              </span>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
              <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Noeuds
              </span>
              <span className="mt-1 block text-sm font-medium text-slate-800 dark:text-slate-100">
                {totalNodes} element{totalNodes > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="space-y-4">
              {draftTree.map((rootNode) => (
                <NodeCard
                  key={rootNode.tempId}
                  node={rootNode}
                  depth={0}
                  employees={employees}
                  onChange={handleChange}
                  onAddChild={handleAddChild}
                  onRemove={handleRemove}
                />
              ))}
            </div>

            {(localError || error) && (
              <p className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-950 dark:bg-rose-950/40">
                {localError || error}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Le formulaire reste compact sur ecran moyen et passe en une colonne sur mobile.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-violet-200 px-5 text-sm font-medium text-violet-700 transition hover:bg-violet-50 dark:border-violet-900 dark:text-violet-300 dark:hover:bg-slate-800"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#58148E] px-5 text-sm font-semibold text-white transition hover:bg-[#4A1178] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function countNodes(node) {
  return 1 + node.children.reduce((count, child) => count + countNodes(child), 0);
}
