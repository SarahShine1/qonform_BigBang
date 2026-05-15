import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  AlertCircle,
  BarChart3,
  FileCheck,
  Gauge,
  Layers,
  MoreVertical,
  PieChart as PieIcon,
  TrendingUp,
  Activity,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../hooks/useAuth";
import { caqApi } from "../../api/caq.api";

// ─── Color palette ────────────────────────────────────────────────────────────
const PURPLE = "#6d28d9";

const STATUS_COLORS = {
  publiee:     "#10b981",
  en_revision: "#f59e0b",
  soumise:     "#3b82f6",
  brouillon:   "#94a3b8",
};

const CHART_COLORS = [PURPLE, "#3b82f6", "#f59e0b", "#10b981"];

// ─── Statut styles ────────────────────────────────────────────────────────────
const STATUT_STYLES = {
  Publiee:    { bg: "bg-emerald-50", text: "text-emerald-700" },
  EnRevision: { bg: "bg-amber-50",   text: "text-amber-700"   },
  Soumise:    { bg: "bg-blue-50",    text: "text-blue-700"    },
  Brouillon:  { bg: "bg-slate-100",  text: "text-slate-600"   },
};

const STATUT_LABELS = {
  Publiee:    "Publiée",
  EnRevision: "En révision",
  Soumise:    "Soumise",
  Brouillon:  "Brouillon",
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatutBadge({ statut }) {
  const s = STATUT_STYLES[statut] || { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.bg} ${s.text}`}>
      {STATUT_LABELS[statut] || statut}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, unit = "", color, bg }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 leading-4">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </span>
      </div>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${color}`}>
        {value}{unit && <span className="text-lg ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-violet-700" />
        <h2 className="text-sm font-bold text-gray-950">{title}</h2>
      </div>
      <MoreVertical className="h-4 w-4 text-slate-400" />
    </div>
  );
}

function ConformityGauge({ value }) {
  if (value == null) {
    return (
      <div className="text-center">
        <p className="text-[11px] text-slate-400 font-semibold">
          Taux de conformité<br />global
        </p>
        <p className="mt-2 text-xs text-slate-400">Non disponible</p>
      </div>
    );
  }
  const normalized = Math.min(Math.max(value, 0), 100);
  const circumference = 263.89;
  const label =
    normalized >= 80 ? "Conforme" :
    normalized >= 60 ? "En progression" : "Non-conforme";
  const badge =
    normalized >= 80 ? "bg-emerald-50 text-emerald-700" :
    normalized >= 60 ? "bg-amber-50 text-amber-700"    : "bg-red-50 text-red-700";

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-[11px] font-semibold text-slate-500">Taux de conformité global</p>
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
        <text x="60" y="65" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#111827">
          {normalized}%
        </text>
      </svg>
      <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${badge}`}>{label}</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-gray-800 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill || p.stroke }} className="font-semibold">
          {p.name} : {p.value}
        </p>
      ))}
    </div>
  );
}

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

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardCAQ() {
  const { user } = useAuth();

  // ── Tous les hooks en haut du composant ───────────────────────────────────
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    let mounted = true;
    caqApi
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

  // ── Sorties anticipées — après tous les hooks ─────────────────────────────
  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  // ── Données réelles (plus de MOCK_DATA) ───────────────────────────────────
  const { kpis, ficheStatus, processusByType, tasksDistribution, departmentStatus } = data;
  const ficheTotal = Object.values(ficheStatus).reduce((a, b) => a + b, 0) || 1;

  return (
    <AppLayout
      pageTitle="Dashboard CAQ"
      userName={userName}
      userRole="CAQ"
      contentClassName="bg-gray-50 px-4 py-4 pb-6"
    >
      {/* ── Zone 1: KPI Cards ────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={Layers}
          label="Processus totaux"
          value={kpis.totalProcessus}
          color="text-violet-700"
          bg="bg-violet-50"
        />
        <KpiCard
          icon={FileCheck}
          label="Fiches publiées"
          value={kpis.fichesPubblieeTaux}
          unit="%"
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <KpiCard
          icon={TrendingUp}
          label="Avancement des tâches"
          value={kpis.tauxAvancementTaches}
          unit="%"
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <KpiCard
          icon={AlertCircle}
          label="Non-conformités"
          value={kpis.nonConformites}
          color="text-red-600"
          bg="bg-red-50"
        />
      </section>

      {/* ── Zone 2: État fiches + Gauge ──────────────────────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">

        <section className="lg:col-span-2 rounded-lg border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={PieIcon} title="État des fiches processus" />
          <div className="px-4 py-4 space-y-3">
            {[
              { key: "Publiee",    value: ficheStatus.Publiee,    color: STATUS_COLORS.publiee     },
              { key: "EnRevision", value: ficheStatus.EnRevision, color: STATUS_COLORS.en_revision },
              { key: "Soumise",    value: ficheStatus.Soumise,    color: STATUS_COLORS.soumise     },
              { key: "Brouillon",  value: ficheStatus.Brouillon,  color: STATUS_COLORS.brouillon   },
            ].map((item) => {
              const pct = Math.round(((item.value || 0) / ficheTotal) * 100);
              return (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-1">
                    <StatutBadge statut={item.key} />
                    <span className="text-xs font-bold text-slate-600">
                      {item.value ?? 0}{" "}
                      <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={Gauge} title="Conformité globale" />
          <div className="flex items-center justify-center p-4 h-[calc(100%-3rem)]">
            <ConformityGauge value={kpis.tauxConformiteGlobal} />
          </div>
        </section>
      </div>

      {/* ── Zone 3: Graphes ──────────────────────────────────────────────── */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={BarChart3} title="Processus par type" />
          <div className="h-[240px] px-2 pb-3">
            {!processusByType?.length ? (
              <EmptyState message="Aucun processus trouvé." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processusByType} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" fontSize={11} tick={{ fill: "#64748b" }} />
                  <YAxis fontSize={11} tick={{ fill: "#64748b" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Processus" fill={PURPLE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={PieIcon} title="Distribution des tâches" />
          <div className="h-[240px] px-2 pb-3">
            {tasksDistribution?.every((t) => t.value === 0) ? (
              <EmptyState message="Aucune tâche trouvée." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasksDistribution}
                    cx="50%"
                    cy="45%"
                    outerRadius={72}
                    labelLine={false}
                    dataKey="value"
                  >
                    {tasksDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={Activity} title="Fiches par département" />
          <div className="h-[240px] px-2 pb-3">
            {!departmentStatus?.length ? (
              <EmptyState message="Aucun département trouvé." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStatus} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="department" fontSize={9} interval={0} tick={{ fill: "#64748b" }} />
                  <YAxis fontSize={11} tick={{ fill: "#64748b" }}
                   tickFormatter={(v) => Math.round(v)} 
                     // ← ajoute cette ligne
                    allowDecimals={false}   />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="publiee"     name="Publiée"     stackId="a" fill={STATUS_COLORS.publiee} />
                  <Bar dataKey="en_revision" name="En révision" stackId="a" fill={STATUS_COLORS.en_revision} />
                  <Bar dataKey="soumise"     name="Soumise"     stackId="a" fill={STATUS_COLORS.soumise} />
                  <Bar dataKey="brouillon"   name="Brouillon"   stackId="a" fill={STATUS_COLORS.brouillon} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}