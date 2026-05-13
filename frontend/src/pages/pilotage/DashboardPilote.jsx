import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileEdit,
  Gauge,
  Layers,
  MoreVertical,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { pilotageApi } from "../../api/pilotage.api";
import { useAuth } from "../../hooks/useAuth";

// ─── Color palette ────────────────────────────────────────────────────────────
const PURPLE = "#6d28d9";
const COLORS = [PURPLE, "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#64748b"];

const STATUT_STYLES = {
  Brouillon:   { bg: "bg-slate-100",  text: "text-slate-600"  },
  Soumise:     { bg: "bg-blue-50",    text: "text-blue-700"   },
  En_revision: { bg: "bg-amber-50",   text: "text-amber-700"  },
  Publiee:     { bg: "bg-emerald-50", text: "text-emerald-700"},
  Archivee:    { bg: "bg-red-50",     text: "text-red-600"    },
};
const STATUT_LABELS = {
  Brouillon:   "Brouillon",
  Soumise:     "Soumise",
  En_revision: "En révision",
  Publiee:     "Publiée",
  Archivee:    "Archivée",
};

function StatutBadge({ statut }) {
  const s = STATUT_STYLES[statut] || { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.bg} ${s.text}`}>
      {STATUT_LABELS[statut] || statut}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPilote() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    pilotageApi
      .getDashboard()
      .then((payload) => { if (mounted) setData(payload); })
      .catch(() => { if (mounted) setError("Impossible de charger le dashboard."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const userName = useMemo(() => {
    if (!user) return "";
    return `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email;
  }, [user]);

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  const kpis     = data?.kpis     || {};
  const audit    = data?.audit    || {};
  const timeline = data?.timeline || [];
  const processus = data?.processus || [];

  return (
    <AppLayout
      pageTitle="Dashboard Pilote"
      userName={userName}
      userRole="Pilote"
      contentClassName="bg-gray-50 px-4 py-4 pb-6"
    >
      {/* ── Zone 1: KPI Cards ────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={Layers}
          label="Processus pilotés"
          value={kpis.totalProcessus ?? 0}
          color="text-violet-700"
          bg="bg-violet-50"
        />
        <KpiCard
          icon={FileEdit}
          label="En brouillon"
          value={kpis.brouillon ?? 0}
          color="text-slate-600"
          bg="bg-slate-100"
        />
        <KpiCard
          icon={Clock}
          label="En attente de validation"
          value={kpis.enAttente ?? 0}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Publiées"
          value={kpis.publiee ?? 0}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
      </section>

      {/* ── Zone 2: Processus table ───────────────────────────────────────── */}
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

      {/* ── Zone 3 + Zone 5: Audit + Timeline ────────────────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Zone 3 — Audit (spans 2/3) */}
        <section className="lg:col-span-2 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-violet-700" />
              <h2 className="text-sm font-bold text-gray-950">Activité d'audit</h2>
            </div>
            <MoreVertical className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex flex-col gap-0 sm:flex-row">
            {/* Gauge */}
            <div className="flex items-center justify-center border-b border-gray-100 p-4 sm:border-b-0 sm:border-r sm:w-52 shrink-0">
              <ConformityGauge value={audit.tauxConformiteMoyen} />
            </div>
            {/* Per-processus NC/Actions table */}
            <div className="flex-1 overflow-x-auto">
              {audit.parProcessus?.length === 0 ? (
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
                    {(audit.parProcessus || []).map((row) => (
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

        {/* Zone 5 — Timeline (1/3) */}
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-violet-700" />
              <h2 className="text-sm font-bold text-gray-950">Activité récente</h2>
            </div>
            <MoreVertical className="h-4 w-4 text-slate-400" />
          </div>
          <div className="divide-y divide-gray-50 overflow-y-auto" style={{ maxHeight: 340 }}>
            {timeline.length === 0 ? (
              <EmptyState message="Aucune activité récente." />
            ) : (
              timeline.map((ev, i) => <TimelineItem key={i} event={ev} navigate={navigate} />)
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 leading-4">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </span>
      </div>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${color}`}>{value}</p>
    </div>
  );
}

// ─── Conformity Gauge (SVG) ───────────────────────────────────────────────────
function ConformityGauge({ value }) {
  if (value == null) {
    return (
      <div className="text-center">
        <p className="text-[11px] text-slate-400 font-semibold">Taux moyen<br />de conformité</p>
        <p className="mt-2 text-xs text-slate-400">Non disponible</p>
      </div>
    );
  }
  const normalized = Math.min(Math.max(value, 0), 100);
  const circumference = 263.89;
  const label =
    normalized >= 90 ? "Conforme" :
    normalized >= 75 ? "Quasi-conforme" :
    normalized >= 60 ? "En progression" : "Non-conforme";
  const badge =
    normalized >= 75 ? "bg-emerald-50 text-emerald-700" :
    normalized >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-[11px] font-semibold text-slate-500">Taux moyen de conformité</p>
      <svg viewBox="0 0 120 120" className="h-24 w-24">
        <circle cx="60" cy="60" r="42" fill="none" stroke="#e5e7eb" strokeWidth="14" />
        <circle
          cx="60" cy="60" r="42"
          fill="none"
          stroke={PURPLE}
          strokeWidth="14"
          strokeDasharray={`${(normalized / 100) * circumference} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          className="transition-all duration-300"
        />
        <text x="60" y="65" textAnchor="middle" className="fill-gray-950 text-base font-bold">
          {normalized}%
        </text>
      </svg>
      <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${badge}`}>{label}</span>
    </div>
  );
}

// ─── NC badge ─────────────────────────────────────────────────────────────────
function NcBadge({ value }) {
  if (!value) return <span className="text-[12px] font-semibold text-slate-400">0</span>;
  return (
    <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600">
      {value}
    </span>
  );
}

// ─── Conformity pill ──────────────────────────────────────────────────────────
function ConformityPill({ value }) {
  const cls =
    value >= 75 ? "bg-emerald-50 text-emerald-700" :
    value >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-600";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>
      {value}%
    </span>
  );
}

// ─── Timeline item ────────────────────────────────────────────────────────────
function TimelineItem({ event, navigate }) {
  const { bg, text } = STATUT_STYLES[event.statut] || { bg: "bg-gray-100", text: "text-gray-600" };
  const dateStr = event.date
    ? new Date(event.date).toLocaleDateString("fr-FR", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  return (
    <div
      className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
      onClick={() => navigate(`/gestion-processus/dossier/${event.id_processus}`)}
    >
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${bg}`}>
        <span className={`h-2 w-2 rounded-full ${text.replace("text-", "bg-")}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-semibold text-gray-800">{event.processus}</p>
        <p className="text-[11px] text-slate-500">
          v{event.version} · <StatutBadge statut={event.statut} />
        </p>
        <p className="mt-0.5 text-[10.5px] text-slate-400">{dateStr}</p>
      </div>
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function EmptyState({ message }) {
  return (
    <div className="flex min-h-[80px] items-center justify-center text-xs text-slate-400 px-4 py-6">
      {message}
    </div>
  );
}
function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-slate-500">
      Chargement du dashboard...
    </div>
  );
}
function ErrorState({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-red-600">
      {message}
    </div>
  );
}
