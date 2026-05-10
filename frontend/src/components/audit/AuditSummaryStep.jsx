import { FileCheck2, Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

export default function AuditSummaryStep({
  sections,
  evaluations,
  complianceRate,
  recommendations,
  correctiveActions,
  onRecommendationsChange,
  onAddAction,
  onUpdateAction,
  onRemoveAction,
  onComplete,
  onGenerateReport,
  finished,
}) {
  const [summaryOpen, setSummaryOpen] = useState(false);

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

  const nonConformities = requirements.filter((requirement) => requirement.status === "non_conforme");
  const ratedRequirements = requirements.filter((requirement) => requirement.status);
  const notRatedCount = requirements.length - ratedRequirements.length;
  const statusCounts = {
    conforme: requirements.filter((requirement) => requirement.status === "conforme").length,
    partiel: requirements.filter((requirement) => requirement.status === "partiel").length,
    nonConforme: nonConformities.length,
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
      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-emerald-50 p-4 text-emerald-700">
            <p className="text-xs font-bold uppercase">Taux de conformité</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-emerald-100">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${complianceRate}%` }}
              />
            </div>
            <p className="mt-2 text-3xl font-bold">{complianceRate}%</p>
          </div>
          <Metric label="Non-conformités" value={nonConformities.length} tone="red" />
          <Metric label="Actions correctives" value={correctiveActions.length} tone="purple" />
        </div>

        <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-sm font-bold text-gray-900">Non-conformités détectées</h3>
          {nonConformities.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aucune non-conformité détectée.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {nonConformities.map((item) => (
                <li key={item.id} className="rounded-md bg-white px-3 py-2 text-sm text-slate-700">
                  <span className="font-semibold text-red-700">{item.clause}</span>
                  {" - "}
                  {item.label}
                  <span className="ml-2 text-xs text-slate-400">({item.sectionTitle})</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <label className="mt-5 block">
          <span className="text-sm font-bold text-gray-900">Recommandations globales</span>
          <textarea
            value={recommendations}
            onChange={(event) => onRecommendationsChange(event.target.value)}
            placeholder="Saisir les recommandations globales de l'audit..."
            className="mt-2 min-h-[110px] w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          />
        </label>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Actions correctives globales</h3>
            <button
              type="button"
              onClick={onAddAction}
              className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-50"
            >
              <Plus className="h-4 w-4" />
              Ajouter une action
            </button>
          </div>

          <div className="mt-3 space-y-3">
            {correctiveActions.map((action, index) => (
              <div key={action.id} className="grid grid-cols-[220px_1fr_40px] gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <select
                  value={action.sectionId}
                  onChange={(event) => onUpdateAction(action.id, { sectionId: event.target.value })}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  {sections.slice(0, -1).map((section) => (
                    <option key={section.id} value={section.id}>{section.title}</option>
                  ))}
                </select>
                <input
                  value={action.description}
                  onChange={(event) => onUpdateAction(action.id, { description: event.target.value })}
                  placeholder={`Action corrective ${index + 1}`}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => onRemoveAction(action.id)}
                  className="flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                  aria-label="Supprimer l'action"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onComplete}
            disabled={finished}
            className="rounded-lg bg-purple-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {finished ? "Audit publié" : "Terminer l'audit"}
          </button>
          {finished && (
            <>
              <button
                type="button"
                onClick={() => setSummaryOpen(true)}
                className="rounded-lg border border-purple-200 bg-white px-5 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-50"
              >
                Afficher synthèse
              </button>
              <button
                type="button"
                onClick={onGenerateReport}
                className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-white px-5 py-2.5 text-sm font-bold text-purple-700 hover:bg-purple-50"
              >
                <FileCheck2 className="h-4 w-4" />
                Générer le rapport
              </button>
            </>
          )}
        </div>
      </section>

      {summaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
          <div className="max-h-[86vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h2 className="m-0 text-xl font-bold text-gray-950">Synthèse de l'audit</h2>
                <p className="mt-1 text-sm text-slate-500">Informations du processus et conformité retenue pour chaque exigence.</p>
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
                        <tr key={`${field.sectionTitle}-${field.label}`} className="border-b border-gray-100 last:border-b-0">
                          <td className="w-[220px] bg-gray-50 px-3 py-2 font-bold text-purple-700">{field.label}</td>
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
                <h3 className="text-sm font-bold text-gray-900">Actions correctives</h3>
                {correctiveActions.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">Aucune action corrective globale saisie.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {correctiveActions.map((action) => {
                      const section = sections.find((item) => item.id === action.sectionId);
                      return (
                        <li key={action.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-slate-700">
                          <span className="font-bold text-purple-700">{section?.title}</span> - {action.description || "Action à préciser"}
                        </li>
                      );
                    })}
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
    <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-bold ${classes[status] || "border-gray-200 bg-gray-50 text-gray-500"}`}>
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
    <div className={`rounded-lg p-4 ${tones[tone]}`}>
      <p className="text-xs font-bold uppercase">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}
