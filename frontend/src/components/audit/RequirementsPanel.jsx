import { ClipboardCheck, Plus, ShieldCheck, Target, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { complianceStatuses } from "../../data/auditExecution.mock";

const statusStyles = {
  conforme: "border-emerald-200 bg-emerald-50 text-emerald-700",
  partiel: "border-amber-200 bg-amber-50 text-amber-700",
  non_conforme: "border-red-200 bg-red-50 text-red-700",
  non_applicable: "border-slate-200 bg-slate-50 text-slate-600",
};

const actionStatuses = ["A faire", "En cours", "Termine"];
const actionPriorities = ["Basse", "Moyenne", "Haute", "Critique"];

export default function RequirementsPanel({
  section,
  evaluations,
  nonConformities = [],
  onChange,
  onAddNonConformity,
}) {
  const manualRequirements = useMemo(
    () => section.requirements.filter((requirement) => requirement.type !== "auto"),
    [section.requirements]
  );

  const autoTotal = section.processFields.length;
  const autoCompleted = section.processFields.filter((field) => isFieldValid(field.value)).length;
  const autoRate = autoTotal === 0 ? 0 : Math.round((autoCompleted / autoTotal) * 100);

  const [ncOpen, setNcOpen] = useState(false);
  const [ncForm, setNcForm] = useState(createNcForm(section, manualRequirements[0]?.id || ""));

  useEffect(() => {
    setNcForm((current) => ({
      ...createNcForm(section, manualRequirements[0]?.id || ""),
      criterionId: current.criterionId || manualRequirements[0]?.id || "",
    }));
  }, [manualRequirements, section]);

  const requirementById = useMemo(
    () => new Map(manualRequirements.map((requirement) => [String(requirement.id), requirement])),
    [manualRequirements]
  );

  const openNcModal = () => {
    setNcForm(createNcForm(section, manualRequirements[0]?.id || ""));
    setNcOpen(true);
  };

  const submitNc = (event) => {
    event.preventDefault();
    if (!ncForm.description.trim()) return;

    const linkedRequirement = requirementById.get(String(ncForm.criterionId));
    onAddNonConformity({
      requirementId: String(ncForm.criterionId || ""),
      title:
        linkedRequirement?.clause ||
        `${section.title} - NC`,
      description: ncForm.description.trim(),
      severity: ncForm.severity,
      criterionLabel: linkedRequirement?.label || "",
      criterionClause: linkedRequirement?.clause || "",
      actions: ncForm.actions
        .filter((action) => action.description.trim())
        .map((action) => ({
          id: action.id,
          description: action.description.trim(),
          responsible: action.responsible.trim(),
          dueDate: action.dueDate,
          priority: action.priority,
          status: action.status,
        })),
    });

    setNcForm(createNcForm(section, manualRequirements[0]?.id || ""));
    setNcOpen(false);
  };

  const updateActionField = (id, patch) => {
    setNcForm((current) => ({
      ...current,
      actions: current.actions.map((action) => (action.id === id ? { ...action, ...patch } : action)),
    }));
  };

  const addActionField = () => {
    setNcForm((current) => ({
      ...current,
      actions: [...current.actions, createActionDraft()],
    }));
  };

  const removeActionField = (id) => {
    setNcForm((current) => ({
      ...current,
      actions: current.actions.filter((action) => action.id !== id),
    }));
  };

  return (
    <section className="min-h-[520px] rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-slate-400" />
          <div className="text-sm font-bold text-gray-950">Critères de conformité ISO 9001</div>
        </div>
        <button
          type="button"
          onClick={openNcModal}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
        >
          <Plus className="h-4 w-4" />
          Ajouter NC
        </button>
      </div>

      <div className="space-y-4 p-4">
        <section className="rounded-xl border border-[#E8E1F5] bg-[#FBFAFE] p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#5b1fa8]" />
              <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-gray-950">
                Taux de complétude
              </h3>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-[#5b1fa8]">{autoRate}%</div>
              <div className="text-[11px] font-medium text-slate-500">
                {autoCompleted}/{autoTotal} auto-vérifiés
              </div>
            </div>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#ECE6F8]">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#5b1fa8_0%,#7c3aed_100%)] transition-all duration-500"
              style={{ width: `${autoRate}%` }}
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#5b1fa8]" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-gray-950">
                Checklist manuelle ISO 9001
              </h3>
              <p className="text-xs text-slate-500">
                Ces critères sont évalués uniquement par l&apos;auditeur.
              </p>
            </div>
          </div>

          {manualRequirements.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-slate-500">
              Cette étape sert à consolider les résultats et clôturer l&apos;audit.
            </div>
          ) : (
            manualRequirements.map((requirement) => {
              const evaluation = evaluations[requirement.id] || { status: "" };
              const existingNc = nonConformities.find(
                (nc) => String(nc.requirementId) === String(requirement.id)
              );

              return (
                <article
                  key={requirement.id}
                  className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold leading-5 text-gray-950">
                        {requirement.label}
                      </p>
                      <p className="mt-1 text-xs font-bold text-[#5b1fa8]">Réf. {requirement.clause}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {complianceStatuses.map((status) => {
                      const checked = evaluation.status === status.value;
                      return (
                        <label
                          key={status.value}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                            checked
                              ? statusStyles[status.value]
                              : "border-gray-200 bg-gray-50 text-slate-600 hover:bg-white"
                          }`}
                        >
                          <input
                            type="radio"
                            name={requirement.id}
                            value={status.value}
                            checked={checked}
                            onChange={() => onChange(requirement.id, { status: status.value })}
                            className="h-4 w-4 accent-[#5b1fa8]"
                          />
                          {status.label}
                        </label>
                      );
                    })}
                  </div>

                  {existingNc && (
                    <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-red-800">{existingNc.title}</p>
                          <p className="mt-1 text-xs text-red-700">
                            {existingNc.description || "Aucune description."}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-red-700">
                          {existingNc.severity}
                        </span>
                      </div>

                      {Array.isArray(existingNc.actions) && existingNc.actions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {existingNc.actions.map((action) => (
                            <div key={action.id} className="rounded-md bg-white px-3 py-2">
                              <div className="text-xs font-bold text-slate-800">
                                {action.description}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                                {action.responsible && <span>Responsable: {action.responsible}</span>}
                                {action.dueDate && <span>Échéance: {action.dueDate}</span>}
                                {action.priority && <span>Priorité: {action.priority}</span>}
                                {action.status && <span>Statut: {action.status}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>

        {nonConformities.length > 0 && (
          <section className="rounded-xl border border-red-100 bg-red-50 p-4">
            <div className="text-xs font-bold uppercase tracking-[0.08em] text-red-700">
              Non-conformités de la section
            </div>
            <div className="mt-3 space-y-2">
              {nonConformities.map((nc) => (
                <div key={nc.id} className="rounded-lg bg-white px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold text-red-800">{nc.title}</p>
                    <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700">
                      {nc.severity}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    {nc.description || "Aucune description."}
                  </p>
                  {nc.actions?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {nc.actions.map((action) => (
                        <div
                          key={action.id}
                          className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
                        >
                          <p className="text-xs font-semibold text-slate-800">{action.description}</p>
                          <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                            {action.responsible && <span>{action.responsible}</span>}
                            {action.priority && <span>{action.priority}</span>}
                            {action.dueDate && <span>{action.dueDate}</span>}
                            {action.status && <span>{action.status}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {ncOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-6 py-6">
          <form
            onSubmit={submitNc}
            className="max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="m-0 text-lg font-bold text-gray-950">Ajouter une non-conformité</h2>
                <p className="mt-1 text-sm text-slate-500">{section.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setNcOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-50"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 px-6 py-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-gray-900">
                  Détails de la non-conformité
                </h3>

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
                    Section concernée
                  </div>
                  <div className="mt-1 text-sm font-semibold text-slate-800">{section.title}</div>
                </div>

                {manualRequirements.length > 0 && (
                  <label className="block">
                    <span className="text-xs font-semibold text-gray-900">Critère ISO concerné</span>
                    <select
                      value={ncForm.criterionId}
                      onChange={(event) =>
                        setNcForm((current) => ({ ...current, criterionId: event.target.value }))
                      }
                      className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      {manualRequirements.map((requirement) => (
                        <option key={requirement.id} value={requirement.id}>
                          {requirement.clause} - {requirement.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="block">
                  <span className="text-xs font-semibold text-gray-900">
                    Description de la non-conformité
                  </span>
                  <textarea
                    value={ncForm.description}
                    onChange={(event) =>
                      setNcForm((current) => ({ ...current, description: event.target.value }))
                    }
                    className="mt-2 min-h-[110px] w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
                    placeholder="Décrire le constat observé..."
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-gray-900">Gravité</span>
                  <select
                    value={ncForm.severity}
                    onChange={(event) =>
                      setNcForm((current) => ({ ...current, severity: event.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    <option>Mineure</option>
                    <option>Majeure</option>
                    <option>Critique</option>
                  </select>
                </label>
              </div>

              <div className="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-gray-900">
                      Actions correctives
                    </h3>
                    <p className="text-xs text-slate-500">
                      Chaque action reste rattachée à cette NC.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addActionField}
                    className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-purple-700 hover:bg-purple-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Ajouter une action corrective
                  </button>
                </div>

                <div className="space-y-3">
                  {ncForm.actions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-200 bg-white px-3 py-4 text-xs text-slate-500">
                      Aucune action corrective ajoutée pour le moment.
                    </div>
                  ) : (
                    ncForm.actions.map((action, index) => (
                      <div key={action.id} className="rounded-lg border border-gray-200 bg-white p-3">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                            Action corrective {index + 1}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeActionField(action.id)}
                            className="rounded-md p-1 text-red-600 hover:bg-red-50"
                            aria-label="Supprimer l'action corrective"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <label className="block">
                            <span className="text-xs font-semibold text-gray-900">Description</span>
                            <input
                              value={action.description}
                              onChange={(event) =>
                                updateActionField(action.id, { description: event.target.value })
                              }
                              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                              placeholder="Description de l'action"
                            />
                          </label>

                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="block">
                              <span className="text-xs font-semibold text-gray-900">Responsable</span>
                              <input
                                value={action.responsible}
                                onChange={(event) =>
                                  updateActionField(action.id, { responsible: event.target.value })
                                }
                                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                                placeholder="Responsable"
                              />
                            </label>

                            <label className="block">
                              <span className="text-xs font-semibold text-gray-900">Date limite</span>
                              <input
                                type="date"
                                value={action.dueDate}
                                onChange={(event) =>
                                  updateActionField(action.id, { dueDate: event.target.value })
                                }
                                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                              />
                            </label>
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <label className="block">
                              <span className="text-xs font-semibold text-gray-900">Priorité</span>
                              <select
                                value={action.priority}
                                onChange={(event) =>
                                  updateActionField(action.id, { priority: event.target.value })
                                }
                                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              >
                                {actionPriorities.map((priority) => (
                                  <option key={priority}>{priority}</option>
                                ))}
                              </select>
                            </label>

                            <label className="block">
                              <span className="text-xs font-semibold text-gray-900">
                                Statut initial
                              </span>
                              <select
                                value={action.status}
                                onChange={(event) =>
                                  updateActionField(action.id, { status: event.target.value })
                                }
                                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              >
                                {actionStatuses.map((status) => (
                                  <option key={status}>{status}</option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setNcOpen(false)}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-md bg-purple-700 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-800"
              >
                Enregistrer la NC
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function createNcForm(section, requirementId) {
  return {
    description: "",
    criterionId: requirementId,
    severity: "Mineure",
    actions: [],
  };
}

function createActionDraft() {
  return {
    id: crypto.randomUUID(),
    description: "",
    responsible: "",
    dueDate: "",
    priority: "Moyenne",
    status: "A faire",
  };
}

function isFieldValid(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(normalized) && normalized !== "non renseigne" && normalized !== "non renseigné";
}
