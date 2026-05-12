import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Network, Search } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../hooks/useAuth";
import { getProcessusList } from "../../api/processus.api";

const TYPE_COLORS = {
  Management: { bg: "#EDE9FE", text: "#58148E" },
  Realisation: { bg: "#D1FAE5", text: "#065F46" },
  Support: { bg: "#FEF3C7", text: "#92400E" },
};

function TypeBadge({ type }) {
  const style = TYPE_COLORS[type] ?? { bg: "#F3F4F6", text: "#374151" };
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {type}
    </span>
  );
}

function ProcessusCard({ processus, onFiche }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:shadow-md">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDE9FE]">
          <Network size={18} className="text-[#58148E]" strokeWidth={1.8} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-slate-800">
            {processus.nom}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400">
              {processus.code_process}
            </span>
            <TypeBadge type={processus.type_process} />
            {processus.pilote_nom && (
              <span className="text-[11px] text-slate-400">
                Pilote&nbsp;: {processus.pilote_nom}
              </span>
            )}
            {processus.departement_nom && (
              <span className="text-[11px] text-slate-300">
                {processus.departement_nom}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onFiche(processus.id_processus)}
        className="flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition"
        style={{ backgroundColor: "#58148E" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#45107A")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#58148E")}
      >
        <FileText size={13} strokeWidth={2} />
        Voir dossier
      </button>
    </div>
  );
}

export default function ProcessusPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [processus, setProcessus] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [search, setSearch]       = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const isPilote = user?.roles?.some(r =>
    ["Pilote", "pilote", "PILOTE"].includes(r)
  );
  const pageTitle = isPilote ? "Mes processus" : "Tous les processus";

  const userName =
    `${user?.prenom ?? ""} ${user?.nom ?? ""}`.trim() ||
    user?.email ||
    "Utilisateur";
  const userRole = user?.roles?.[0] ?? "";

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // Pilotes only see their department; everyone else sees all
    const params =
      isPilote && user.departement != null
        ? { departement: user.departement }
        : {};
    getProcessusList(params)
      .then(setProcessus)
      .catch(() => setError("Impossible de charger les processus."))
      .finally(() => setLoading(false));
  }, [user, isPilote]);

  const handleDossier = (id) => navigate(`/gestion-processus/dossier/${id}`);

  // Unique department names for the filter dropdown (non-pilotes only)
  const departments = [
    ...new Set(processus.map(p => p.departement_nom).filter(Boolean)),
  ].sort();

  // Client-side search + dept filter
  const filtered = processus.filter(p => {
    const matchSearch =
      !search || p.nom.toLowerCase().includes(search.toLowerCase());
    const matchDept =
      !deptFilter || p.departement_nom === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <AppLayout pageTitle={pageTitle} userName={userName} userRole={userRole}>
      <div className="mx-auto max-w-4xl space-y-3">
        {/* ── Search + filters header ── */}
        <div className="flex flex-wrap items-center gap-3 pb-1">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Rechercher un processus…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-[12.5px] outline-none transition focus:border-purple-400 focus:ring-1 focus:ring-purple-100"
            />
          </div>

          {!isPilote && departments.length > 0 && (
            <select
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12.5px] text-slate-600 outline-none transition focus:border-purple-400"
            >
              <option value="">Tous les départements</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          {!loading && !error && (
            <span className="shrink-0 text-[11px] text-slate-400">
              {filtered.length} processus
            </span>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-[13px] text-slate-400">
            Chargement…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex items-center justify-center py-16 text-[13px] text-slate-400">
            {search || deptFilter
              ? "Aucun résultat pour cette recherche."
              : "Aucun processus trouvé."}
          </div>
        )}

        {!loading &&
          !error &&
          filtered.map(p => (
            <ProcessusCard
              key={p.id_processus}
              processus={p}
              onFiche={handleDossier}
            />
          ))}
      </div>
    </AppLayout>
  );
}
