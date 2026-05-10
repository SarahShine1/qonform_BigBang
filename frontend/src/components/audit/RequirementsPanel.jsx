import { AlertTriangle, ClipboardCheck } from "lucide-react";
import { complianceStatuses } from "../../data/auditExecution.mock";

const statusStyles = {
  conforme: "border-emerald-500 bg-emerald-50 text-emerald-700",
  partiel: "border-amber-500 bg-amber-50 text-amber-700",
  non_conforme: "border-red-500 bg-red-50 text-red-700",
  non_applicable: "border-slate-400 bg-slate-50 text-slate-600",
};

export default function RequirementsPanel({ section, evaluations, onChange }) {
  return (
    <section className="min-h-[600px] rounded-md border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-5 py-4">
        <ClipboardCheck className="h-5 w-5 text-slate-400" />
        <div className="text-base font-bold text-gray-900">Critères de conformité ISO 9001</div>
      </div>

      <div className="space-y-3 p-5">
        {section.requirements.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-sm text-slate-500">
            Cette étape sert à consolider les résultats et clôturer l'audit.
          </div>
        ) : (
          section.requirements.map((requirement) => {
            const evaluation = evaluations[requirement.id] || { status: "" };
            return (
              <article key={requirement.id} className="rounded-md border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold leading-6 text-gray-950">{requirement.label}</p>
                    <p className="mt-1 text-xs font-bold text-[#5b1fa8]">Réf. {requirement.clause}</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {complianceStatuses.map((status) => {
                    const checked = evaluation.status === status.value;
                    return (
                      <label
                        key={status.value}
                        className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold transition ${
                          checked ? statusStyles[status.value] : "border-gray-200 bg-gray-50 text-slate-600 hover:bg-white"
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

                {evaluation.status === "non_conforme" && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    Non-conformité détectée, à reprendre dans la synthèse.
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
