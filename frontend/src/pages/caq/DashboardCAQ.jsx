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
  Filter,
  Gauge,
  Layers,
  MoreVertical,
  PieChart as PieIcon,
  RotateCcw,
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
const STATUS_TO_DEPARTMENT_KEY = {
  Publiee: "publiee",
  EnRevision: "en_revision",
  Soumise: "soumise",
  Brouillon: "brouillon",
};

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "Publiee", label: "Publiée" },
  { value: "EnRevision", label: "En révision" },
  { value: "Soumise", label: "Soumise" },
  { value: "Brouillon", label: "Brouillon" },
];

function StatutBadge({ statut }) {
  const s = STATUT_STYLES[statut] || { bg: "bg-gray-100", text: "text-gray-600" };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${s.bg} ${s.text}`}>
      {STATUT_LABELS[statut] || statut}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, unit = "", color, bg, active = false, onClick }) {
  const className = `rounded-lg border bg-white px-4 py-4 text-left shadow-sm ${
    onClick ? "transition hover:border-violet-300" : ""
  } ${active ? "border-violet-300 ring-1 ring-violet-100" : "border-gray-200"}`;
  const content = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 leading-4">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${bg}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </span>
      </div>
      <p className={`mt-2 text-3xl font-bold tracking-tight ${color}`}>
        {value}{unit && <span className="text-lg ml-0.5">{unit}</span>}
      </p>
    </>
  );

  if (!onClick) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
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
function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="min-w-[150px] flex-1">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-600 outline-none transition focus:border-violet-300 focus:ring-1 focus:ring-violet-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ShortcutButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition ${
        active
          ? "border-violet-300 bg-violet-50 text-violet-700"
          : "border-slate-200 bg-white text-slate-500 hover:border-violet-200 hover:text-violet-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function DashboardCAQ() {
  const { user } = useAuth();

  // ── Tous les hooks en haut du composant ───────────────────────────────────
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [shortcut, setShortcut] = useState("");

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

  const safeData = data || {
    kpis: {},
    ficheStatus: { Publiee: 0, EnRevision: 0, Soumise: 0, Brouillon: 0 },
    processusByType: [],
    tasksDistribution: [],
    departmentStatus: [],
  };
  const { kpis, ficheStatus, processusByType, tasksDistribution, departmentStatus } = safeData;
  const typeOptions = [
    { value: "", label: "Tous les types" },
    ...processusByType.map((item) => ({ value: item.name, label: item.name })),
  ];
  const departmentOptions = [
    { value: "", label: "Tous les départements" },
    ...departmentStatus.map((item) => ({ value: item.department, label: item.department })),
  ];
  const selectedDepartmentStatus = departmentFilter
    ? departmentStatus.find((item) => item.department === departmentFilter)
    : null;
  const baseFicheStatus = selectedDepartmentStatus
    ? {
        Publiee: selectedDepartmentStatus.publiee || 0,
        EnRevision: selectedDepartmentStatus.en_revision || 0,
        Soumise: selectedDepartmentStatus.soumise || 0,
        Brouillon: selectedDepartmentStatus.brouillon || 0,
      }
    : ficheStatus;
  const displayedFicheStatus = statusFilter
    ? {
        Publiee: statusFilter === "Publiee" ? baseFicheStatus.Publiee || 0 : 0,
        EnRevision: statusFilter === "EnRevision" ? baseFicheStatus.EnRevision || 0 : 0,
        Soumise: statusFilter === "Soumise" ? baseFicheStatus.Soumise || 0 : 0,
        Brouillon: statusFilter === "Brouillon" ? baseFicheStatus.Brouillon || 0 : 0,
      }
    : baseFicheStatus;
  const ficheTotal = Object.values(displayedFicheStatus).reduce((a, b) => a + b, 0) || 1;
  const displayedProcessusByType = typeFilter
    ? processusByType.filter((item) => item.name === typeFilter)
    : processusByType;
  const baseDepartmentStatus = departmentFilter
    ? departmentStatus.filter((item) => item.department === departmentFilter)
    : departmentStatus;
  const displayedDepartmentStatus = statusFilter
    ? baseDepartmentStatus.map((item) => {
        const visibleKey = STATUS_TO_DEPARTMENT_KEY[statusFilter];
        return {
          ...item,
          publiee: visibleKey === "publiee" ? item.publiee : 0,
          en_revision: visibleKey === "en_revision" ? item.en_revision : 0,
          soumise: visibleKey === "soumise" ? item.soumise : 0,
          brouillon: visibleKey === "brouillon" ? item.brouillon : 0,
        };
      })
    : baseDepartmentStatus;
  const displayedTasksDistribution = shortcut === "tasks"
    ? tasksDistribution.filter((item) => item.value > 0)
    : tasksDistribution;
  const hasActiveFilters = Boolean(typeFilter || departmentFilter || statusFilter || shortcut);
  const resetFilters = () => {
    setTypeFilter("");
    setDepartmentFilter("");
    setStatusFilter("");
    setShortcut("");
  };

  // ── Sorties anticipées — après tous les hooks ─────────────────────────────
  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;

  // ── Données réelles (plus de MOCK_DATA) ───────────────────────────────────
  return (
    <AppLayout
      pageTitle="Dashboard CAQ"
      userName={userName}
      userRole="CAQ"
      contentClassName="bg-gray-50 px-4 py-4 pb-6"
    >
      <section className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Filter className="h-4 w-4 text-violet-700" />
            Filtres rapides
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
            <FilterSelect
              label="Type"
              value={typeFilter}
              onChange={setTypeFilter}
              options={typeOptions}
            />
            <FilterSelect
              label="Departement"
              value={departmentFilter}
              onChange={setDepartmentFilter}
              options={departmentOptions}
            />
            <FilterSelect
              label="Statut"
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
            />
            <ShortcutButton
              active={shortcut === "tasks"}
              onClick={() => setShortcut(shortcut === "tasks" ? "" : "tasks")}
            >
              Taches actives
            </ShortcutButton>
            <ShortcutButton
              active={statusFilter === "Publiee"}
              onClick={() => setStatusFilter(statusFilter === "Publiee" ? "" : "Publiee")}
            >
              Fiches publiees
            </ShortcutButton>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-500 transition hover:border-violet-200 hover:text-violet-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── Zone 1: KPI Cards ────────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={Layers}
          label="Processus totaux"
          value={kpis.totalProcessus}
          color="text-violet-700"
          bg="bg-violet-50"
          onClick={resetFilters}
        />
        <KpiCard
          icon={FileCheck}
          label="Fiches publiées"
          value={kpis.fichesPubblieeTaux}
          unit="%"
          color="text-emerald-600"
          bg="bg-emerald-50"
          active={statusFilter === "Publiee"}
          onClick={() => setStatusFilter(statusFilter === "Publiee" ? "" : "Publiee")}
        />
        <KpiCard
          icon={TrendingUp}
          label="Avancement des tâches"
          value={kpis.tauxAvancementTaches}
          unit="%"
          color="text-blue-600"
          bg="bg-blue-50"
          active={shortcut === "tasks"}
          onClick={() => setShortcut(shortcut === "tasks" ? "" : "tasks")}
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
              { key: "Publiee",    value: displayedFicheStatus.Publiee,    color: STATUS_COLORS.publiee     },
              { key: "EnRevision", value: displayedFicheStatus.EnRevision, color: STATUS_COLORS.en_revision },
              { key: "Soumise",    value: displayedFicheStatus.Soumise,    color: STATUS_COLORS.soumise     },
              { key: "Brouillon",  value: displayedFicheStatus.Brouillon,  color: STATUS_COLORS.brouillon   },
            ].map((item) => {
              const pct = Math.round(((item.value || 0) / ficheTotal) * 100);
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === item.key ? "" : item.key)}
                  className={`block w-full rounded-md px-2 py-1 text-left transition ${
                    statusFilter === item.key ? "bg-violet-50/70" : "hover:bg-slate-50"
                  }`}
                >
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
                </button>
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
            {!displayedProcessusByType?.length ? (
              <EmptyState message="Aucun processus trouvé." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayedProcessusByType} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" fontSize={11} tick={{ fill: "#64748b" }} />
                  <YAxis fontSize={11} tick={{ fill: "#64748b" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    name="Processus"
                    fill={PURPLE}
                    radius={[4, 4, 0, 0]}
                    onClick={(entry) => {
                      const type = entry?.name || entry?.payload?.name;
                      if (type) {
                        setTypeFilter(typeFilter === type ? "" : type);
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <SectionHeader icon={PieIcon} title="Distribution des tâches" />
          <div className="h-[240px] px-2 pb-3">
            {displayedTasksDistribution?.every((t) => t.value === 0) ? (
              <EmptyState message="Aucune tâche trouvée." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayedTasksDistribution}
                    cx="50%"
                    cy="45%"
                    outerRadius={72}
                    labelLine={false}
                    dataKey="value"
                  >
                    {displayedTasksDistribution.map((_, index) => (
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
            {!displayedDepartmentStatus?.length ? (
              <EmptyState message="Aucun département trouvé." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayedDepartmentStatus}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                  onClick={(state) => {
                    const department = state?.activePayload?.[0]?.payload?.department;
                    if (department) {
                      setDepartmentFilter(departmentFilter === department ? "" : department);
                    }
                  }}
                >
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
