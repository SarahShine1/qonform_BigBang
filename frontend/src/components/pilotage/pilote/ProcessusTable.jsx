import { useNavigate } from "react-router-dom";
import { BarChart3, ExternalLink, MoreVertical } from "lucide-react";
import StatutBadge from "./StatutBadge";

function EmptyState({ message }) {
  return (
    <div className="flex min-h-[80px] items-center justify-center text-xs text-slate-400 px-4 py-6">
      {message}
    </div>
  );
}

export default function ProcessusTable({ processus }) {
  const navigate = useNavigate();

  return (
    <section className="mt-4 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-violet-700" />
          <h2 className="text-sm font-bold text-gray-950">État des fiches par processus</h2>
        </div>
        <MoreVertical className="h-4 w-4 text-slate-400" />
      </div>

      {processus.length === 0 ? (
        <EmptyState message="Aucun processus trouvé." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-2.5">Processus</th>
                <th className="px-4 py-2.5">Version</th>
                <th className="px-4 py-2.5">Statut</th>
                <th className="px-4 py-2.5">Norme</th>
                <th className="px-4 py-2.5">Dernière modif.</th>
                <th className="px-4 py-2.5 text-center">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {processus.map((p) => {
                const lv = p.latestVersion;
                return (
                  <tr key={p.id_processus} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-gray-900 leading-5">{p.nom}</div>
                      <div className="text-[11px] text-slate-400">{p.code_process}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {lv ? `v${lv.numero_version}` : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {lv ? <StatutBadge statut={lv.statut} /> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-600">
                      {lv?.norme || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-[12px] text-slate-500">
                      {lv?.date_derniere_modif
                        ? new Date(lv.date_derniere_modif).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        onClick={() => navigate(`/gestion-processus/dossier/${p.id_processus}`)}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold text-violet-700 hover:bg-violet-50 transition-colors"
                      >
                        Voir <ExternalLink className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
