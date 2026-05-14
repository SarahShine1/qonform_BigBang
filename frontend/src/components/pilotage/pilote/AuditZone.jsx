import { Gauge, MoreVertical } from "lucide-react";
import ConformityGauge from "./ConformityGauge";
import NcBadge from "./NcBadge";
import ConformityPill from "./ConformityPill";

function EmptyState({ message }) {
  return (
    <div className="flex min-h-[80px] items-center justify-center text-xs text-slate-400 px-4 py-6">
      {message}
    </div>
  );
}

export default function AuditZone({ audit }) {
  const { tauxConformiteMoyen, parProcessus = [] } = audit;

  return (
    <section className="lg:col-span-2 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-violet-700" />
          <h2 className="text-sm font-bold text-gray-950">Activité d'audit</h2>
        </div>
        <MoreVertical className="h-4 w-4 text-slate-400" />
      </div>

      <div className="flex flex-col gap-0 sm:flex-row">
        <div className="flex items-center justify-center border-b border-gray-100 p-4 sm:border-b-0 sm:border-r sm:w-52 shrink-0">
          <ConformityGauge value={tauxConformiteMoyen} />
        </div>

        <div className="flex-1 overflow-x-auto">
          {parProcessus.length === 0 ? (
            <EmptyState message="Aucune donnée d'audit." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2.5">Processus</th>
                  <th className="px-4 py-2.5 text-center">NC</th>
                  <th className="px-4 py-2.5 text-center">Actions</th>
                  <th className="px-4 py-2.5 text-center">Conformité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {parProcessus.map((row) => (
                  <tr key={row.id_processus} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-2 text-slate-800 font-medium">{row.nom}</td>
                    <td className="px-4 py-2 text-center">
                      <NcBadge value={row.nbNC} />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="text-[12px] font-semibold text-slate-600">{row.nbActions}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {row.taux != null ? (
                        <ConformityPill value={row.taux} />
                      ) : (
                        <span className="text-[11px] text-slate-400">Non audité</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
