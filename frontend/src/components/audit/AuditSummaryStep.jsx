import { FileCheck2, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

export default function AuditSummaryStep({
  sections,
  evaluations,
  complianceRate,
  auditMetrics,
  recommendations,
  correctiveActions,
  nonConformities: auditNonConformities = [],
  onRecommendationsChange,
  onAddAction,
  onUpdateAction,
  onRemoveAction,
  onSendBack,
  onPublish,
  onGenerateReport,
  isPublished,
  isSubmitting,
  currentStatus,
}) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);

  const requirements = useMemo(
    () =>
      sections.flatMap((section) =>
        section.requirements.map((requirement) => ({
          ...requirement,
          sectionTitle: section.title,
          status: evaluations[requirement.id]?.status || "",
        }))
      ),
    [sections, evaluations]
  );

  const requirementNonConformities = requirements.filter(
    (requirement) => requirement.status === "non_conforme"
  );
  const partialRequirements = requirements.filter((requirement) => requirement.status === "partiel");
  const weakRequirements = [...requirementNonConformities, ...partialRequirements];
  const ratedRequirements = requirements.filter((requirement) => requirement.status);
  const notRatedCount = requirements.length - ratedRequirements.length;
  const statusCounts = {
    conforme: requirements.filter((requirement) => requirement.status === "conforme").length,
    partiel: requirements.filter((requirement) => requirement.status === "partiel").length,
    nonConforme: requirementNonConformities.length,
    nonApplicable: requirements.filter((requirement) => requirement.status === "non_applicable").length,
  };
  const processInfoSections = sections.slice(0, -1);
  const generalFields = processInfoSections.flatMap((section) =>
    section.processFields.map((field) => ({
      ...field,
      sectionTitle: section.title,
    }))
  );

  return (
    <>
      <section className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
            <p className="text-xs font-bold uppercase">Taux de conformité</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${complianceRate}%` }}
              />
            </div>
            <p className="mt-2 text-2xl font-bold">{complianceRate}%</p>
          </div>
          <Metric
            label="Non-conformités"
            value={requirementNonConformities.length + auditNonConformities.length}
            tone="red"
          />
          <Metric label="Actions correctives" value={correctiveActions.length} tone="purple" />
        </div>

        {auditMetrics && (
          <div className="mt-3 grid grid-cols-4 gap-3">
            <Metric label="Completude" value={`${auditMetrics.tauxCompletudeMoyen}%`} tone="purple" />
            <Metric label="Checklist" value={`${auditMetrics.scoreChecklist}%`} tone="purple" />
            <Metric label="BPMN" value={`${auditMetrics.scoreBpmn}%`} tone="purple" />
            <Metric label="Preuves" value={`${auditMetrics.scorePreuves}%`} tone="purple" />
          </div>
        )}

        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <h3 className="text-sm font-bold text-gray-900">Non-conformités détectées</h3>
          {weakRequirements.length === 0 && auditNonConformities.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aucune non-conformité détectée.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {weakRequirements.map((item) => (
                <li key={item.id} className="rounded-md bg-white px-3 py-2 text-sm text-slate-700">
                  <span className="font-semibold text-red-700">{item.clause}</span>
                  {" - "}
                  {item.label}
                  <span className="ml-2 text-xs text-slate-400">
                    ({item.sectionTitle} - {item.status === "partiel" ? "Partiel" : "Non conforme"})
                  </span>
                </li>
              ))}
              {auditNonConformities.map((item) => (
                <li key={item.id} className="rounded-md bg-white px-3 py-2 text-sm text-slate-700">
                  <span className="font-semibold text-red-700">{item.title}</span>
                  <span className="ml-2 text-xs text-slate-400">
                    {item.sectionTitle} - {item.severity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-gray-900">Recommandations globales</span>
          <textarea
            value={recommendations}
            onChange={(event) => onRecommendationsChange(event.target.value)}
            placeholder="Saisir les recommandations globales de l'audit..."
            className="mt-2 min-h-[90px] w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          />
        </label>

        <div className="mt-4">
          <h3 className="text-sm font-bold text-gray-900">Actions correctives liées aux NC</h3>
          <div className="mt-3 space-y-3">
            {auditNonConformities.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-3 text-sm text-slate-500">
                Ajoutez d'abord une non-conformité dans une section pour pouvoir créer une action corrective.
              </div>
            ) : (
              auditNonConformities.map((nc) => {
                const ncActions = correctiveActions.filter((action) => action.ncId === nc.id);

                return (
                  <div key={nc.id} className="rounded-lg border border-red-100 bg-red-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-red-800">{nc.title}</div>
                        <div className="mt-1 text-xs text-red-700">
                          {nc.sectionTitle} - {nc.severity}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAddAction(nc.id)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-purple-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Ajouter action
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {ncActions.length === 0 ? (
                        <p className="text-xs text-red-700">
                          Aucune action corrective liée à cette NC.
                        </p>
                      ) : (
                        ncActions.map((action, index) => (
                          <div key={action.id} className="grid grid-cols-[1fr_34px] gap-2 rounded-md bg-white p-2">
                            <input
                              value={action.description}
                              onChange={(event) =>
                                onUpdateAction(action.id, { description: event.target.value })
                              }
                              placeholder={`Action corrective ${index + 1}`}
                              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => onRemoveAction(action.id)}
                              className="flex items-center justify-center rounded-md text-red-600 hover:bg-red-50"
                              aria-label="Supprimer l'action"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setFinishOpen(true)}
            disabled={isSubmitting || isPublished}
            className="rounded-md bg-purple-700 px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPublished ? "Audit publié" : "Terminer l'audit"}
          </button>
          {isPublished && (
            <>
              <button
                type="button"
                onClick={() => setSummaryOpen(true)}
                className="rounded-md border border-purple-200 bg-white px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50"
              >
                Voir synthèse
              </button>
              <button
                type="button"
                onClick={onGenerateReport}
                className="inline-flex items-center gap-2 rounded-md border border-purple-200 bg-white px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50"
              >
                <FileCheck2 className="h-4 w-4" />
                Générer le rapport
              </button>
            </>
          )}
        </div>
      </section>

      {finishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
          <div className="w-full max-w-xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="m-0 text-lg font-bold text-gray-950">Finaliser l&apos;audit</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choisissez si la fiche doit être renvoyée au pilote ou publiée.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFinishOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-50"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Renvoyer au pilote pour correction
                </p>
                <p className="mt-1 text-sm text-amber-800">
                  La fiche reste en révision et le pilote pourra la corriger puis la renvoyer.
                </p>
              </div>

              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-900">Publier la fiche auditée</p>
                <p className="mt-1 text-sm text-emerald-800">
                  La fiche devient publiée et un rapport d&apos;audit y sera lié automatiquement.
                </p>
              </div>

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-slate-600">
                Statut actuel : <span className="font-semibold text-slate-900">{currentStatus}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setFinishOpen(false)}
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onSendBack();
                  } finally {
                    setFinishOpen(false);
                  }
                }}
                disabled={isSubmitting}
                className="rounded-md border border-amber-200 bg-white px-4 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-60"
              >
                Renvoyer au pilote pour correction
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onPublish();
                  } finally {
                    setFinishOpen(false);
                  }
                }}
                disabled={isSubmitting}
                className="rounded-md bg-purple-700 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-800 disabled:opacity-60"
              >
                Publier la fiche auditée
              </button>
            </div>
          </div>
        </div>
      )}

      {summaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
          <div className="max-h-[86vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="m-0 text-xl font-bold text-gray-950">Synthèse de l&apos;audit</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Informations du processus et conformité retenue pour chaque exigence.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-50"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid grid-cols-5 gap-3">
                <SummaryMetric label="Conformité" value={`${complianceRate}%`} />
                <SummaryMetric label="Cotés" value={`${ratedRequirements.length}/${requirements.length}`} />
                <SummaryMetric label="Conformes" value={statusCounts.conforme} />
                <SummaryMetric label="Partiels" value={statusCounts.partiel} />
                <SummaryMetric label="NC" value={statusCounts.nonConforme} />
              </div>

              {notRatedCount > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700">
                  {notRatedCount} critère(s) restent non cotés.
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold text-gray-900">Informations générales du processus</h3>
                <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full border-collapse text-sm">
                    <tbody>
                      {generalFields.map((field) => (
                        <tr
                          key={`${field.sectionTitle}-${field.label}`}
                          className="border-b border-gray-100 last:border-b-0"
                        >
                          <td className="w-[220px] bg-gray-50 px-3 py-2 font-bold text-purple-700">
                            {field.label}
                          </td>
                          <td className="px-3 py-2 text-slate-700">{field.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900">Exigences parcourues</h3>
                <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-2">Section</th>
                        <th className="px-3 py-2">Réf.</th>
                        <th className="px-3 py-2">Exigence</th>
                        <th className="px-3 py-2">Conformité sélectionnée</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requirements.map((requirement) => (
                        <tr key={requirement.id} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-slate-500">{requirement.sectionTitle}</td>
                          <td className="px-3 py-2 font-bold text-purple-700">{requirement.clause}</td>
                          <td className="px-3 py-2 text-slate-700">{requirement.label}</td>
                          <td className="px-3 py-2">
                            <StatusBadge status={requirement.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900">Actions correctives liées aux NC</h3>
                {correctiveActions.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">
                    Aucune action corrective liée à une NC saisie.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {correctiveActions.map((action) => {
                      const nc = auditNonConformities.find((item) => item.id === action.ncId);
                      return (
                        <li
                          key={action.id}
                          className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-slate-700"
                        >
                          <span className="font-bold text-purple-700">{nc?.title || "NC"}</span> -{" "}
                          {action.description || "Action à préciser"}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900">NC ajoutées par section</h3>
                {auditNonConformities.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">Aucune NC manuelle ajoutée.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {auditNonConformities.map((nc) => (
                      <li
                        key={nc.id}
                        className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800"
                      >
                        <span className="font-bold">{nc.sectionTitle}</span> - {nc.title}
                        <div className="mt-1 text-xs text-red-700">
                          {nc.description || "Aucune description."}
                        </div>
                        {Array.isArray(nc.actions) && nc.actions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {nc.actions.map((action) => (
                              <div key={action.id} className="rounded-md bg-white px-3 py-2 text-xs text-slate-700">
                                <div className="font-semibold text-slate-800">{action.description}</div>
                                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500">
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function StatusBadge({ status }) {
  const labels = {
    conforme: "Conforme",
    partiel: "Partiellement conforme",
    non_conforme: "Non conforme",
    non_applicable: "Non applicable",
  };
  const classes = {
    conforme: "border-emerald-200 bg-emerald-50 text-emerald-700",
    partiel: "border-amber-200 bg-amber-50 text-amber-700",
    non_conforme: "border-red-200 bg-red-50 text-red-700",
    non_applicable: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${
        classes[status] || "border-gray-200 bg-gray-50 text-gray-500"
      }`}
    >
      {labels[status] || "Non coté"}
    </span>
  );
}

function SummaryMetric({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-[11px] font-bold uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-950">{value}</p>
    </div>
  );
}

function Metric({ label, value, tone }) {
  const tones = {
    red: "bg-red-50 text-red-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div className={`rounded-lg p-3 ${tones[tone]}`}>
      <p className="text-xs font-bold uppercase">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
