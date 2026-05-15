import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Gauge,
  MoreVertical,
  PieChart,
  RotateCcw,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { auditApi } from "../../api/audit.api";
import { useAuth } from "../../hooks/useAuth";

const COLORS = ["#6d28d9", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#64748b"];

export default function DashboardAuditeur() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    auditApi
      .getDashboard()
      .then((payload) => {
        if (mounted) setData(payload);
      })
      .catch(() => {
        if (mounted) setError("Impossible de charger le dashboard auditeur.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const userName = useMemo(() => {
    if (!user) return "";
    return `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email;
  }, [user]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const kpis = data?.kpis || {};
  const conformity = data?.tauxMoyenConformite || 0;
  const ficheKpis = buildFicheKpis(data?.fichesParStatut || []);

  return (
    <AppLayout
      pageTitle="Dashboard Auditeur"
      userName={userName}
      userRole="Auditeur"
      contentClassName="bg-gray-50 px-4 py-4 pb-5"
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ficheKpis.map((item) => (
          <KpiCard key={item.label} {...item} />
        ))}
      </section>

      <section className="mt-3">
        <ChartCard title="État de mes tâches" icon={BarChart3} wide>
          <CompactTaskStatus data={normalizeTaskLabels(data?.tachesParStatut || [])} alerts={data?.alertes || []} />
        </ChartCard>
      </section>

      <section className="mt-5 grid gap-3 lg:grid-cols-3">
        <ChartCard title="Progression des processus audités" icon={PieChart} compact>
          <DonutChart
            data={[
              { label: "Audités", value: data?.progressionAudits?.audites || 0, color: COLORS[0], unit: "processus" },
              { label: "Restants", value: data?.progressionAudits?.restants || 0, color: "#e5e7eb", unit: "processus" },
            ]}
            center={`${data?.progressionAudits?.pourcentage || 0}%`}
            caption={`${data?.progressionAudits?.audites || 0} / ${kpis.totalProcessus || 0} processus audités`}
          />
        </ChartCard>

        <ChartCard title="Résultats des audits réalisés" icon={BarChart3} compact>
          <VerticalBars data={normalizeResultLabels(data?.resultatsAudits || [])} unit="audit" compact />
        </ChartCard>

        <ChartCard title="Taux moyen de conformité" icon={Gauge} compact>
          <GaugeChart value={conformity} />
        </ChartCard>
      </section>
    </AppLayout>
  );
}

function KpiCard({ label, value, icon: Icon, iconClassName, valueClassName }) {
  return (
    <section className="h-[128px] rounded-lg border border-gray-200 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className={`mt-7 text-3xl font-extrabold leading-none ${valueClassName}`}>{value}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-full ${iconClassName}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </section>
  );
}

function ChartCard({ title, icon: Icon, children, compact = false, wide = false }) {
  const cardHeight = wide ? "h-[206px]" : compact ? "h-[218px]" : "h-[218px]";
  const bodyHeight = wide ? "h-[148px]" : compact ? "h-[164px]" : "h-[164px]";

  return (
    <section className={`${cardHeight} rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className="h-4 w-4 shrink-0 text-purple-700" />
          <h2 className="truncate text-sm font-bold text-gray-950">{title}</h2>
        </div>
        <MoreVertical className="h-4 w-4 shrink-0 text-slate-400" />
      </div>
      <div className={`relative ${bodyHeight}`}>{children}</div>
    </section>
  );
}

function DonutChart({ data, center, caption }) {
  const [hovered, setHovered] = useState(null);
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  if (!total) return <EmptyChart />;

  let offset = 25;
  const active = hovered === null ? null : data[hovered];

  return (
    <div className="relative flex h-full items-center justify-center gap-3">
      <div className="shrink-0">
        <svg viewBox="0 0 120 120" className="h-[92px] w-[92px] xl:h-24 xl:w-24">
          <circle cx="60" cy="60" r="42" fill="none" stroke="#e5e7eb" strokeWidth="16" />
          {data.map((item, index) => {
            const dash = (Number(item.value || 0) / total) * 263.89;
            const segment = (
              <circle
                key={item.label}
                cx="60"
                cy="60"
                r="42"
                fill="none"
                stroke={item.color || COLORS[index % COLORS.length]}
                strokeWidth={hovered === index ? "18" : "16"}
                strokeDasharray={`${dash} ${263.89 - dash}`}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                className="cursor-pointer transition-all duration-200"
                opacity={hovered === null || hovered === index ? 1 : 0.42}
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              />
            );
            offset -= dash;
            return segment;
          })}
          <text x="60" y="65" textAnchor="middle" className="fill-gray-950 text-base font-bold">
            {center}
          </text>
        </svg>
        {caption && <p className="-mt-1 text-center text-[11px] font-semibold text-slate-600">{caption}</p>}
      </div>
      <Legend data={data} />
      {active && (
        <ChartTooltip>
          <strong>{active.label}</strong> : {active.value} {active.unit || ""} - {Math.round((active.value / total) * 100)}%
        </ChartTooltip>
      )}
    </div>
  );
}

function VerticalBars({ data, unit, compact = false }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...data.map((item) => item.value || 0), 0);
  if (!max) return <EmptyChart />;
  const active = hovered === null ? null : data[hovered];

  return (
    <div className="relative flex h-full items-end gap-3 border-b border-gray-100 pt-1">
      {data.map((item, index) => (
        <div
          key={item.label}
          className="flex flex-1 cursor-pointer flex-col items-center gap-2"
          onMouseEnter={() => setHovered(index)}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="text-xs font-bold text-slate-700">{item.value}</div>
          <div
            className="w-full max-w-[42px] rounded-t-md transition-all duration-200"
            style={{
              height: `${Math.max(((item.value || 0) / max) * (compact ? 54 : 82), 7)}px`,
              background: COLORS[index % COLORS.length],
              opacity: hovered === null || hovered === index ? 1 : 0.38,
              transform: hovered === index ? "scaleX(1.08)" : "scaleX(1)",
            }}
          />
          <div className="h-8 text-center text-[11px] font-semibold leading-4 text-slate-500">{item.label}</div>
        </div>
      ))}
      {active && (
        <ChartTooltip>
          <strong>{active.label}</strong> : {active.value} {plural(unit, active.value)}
        </ChartTooltip>
      )}
    </div>
  );
}

function CompactTaskStatus({ data, alerts = [] }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...data.map((item) => item.value || 0), 0);
  if (!max) return <EmptyChart />;
  const active = hovered === null ? null : data[hovered];
  const urgentAlerts = alerts
    .filter((alert) => {
      const message = String(alert.message || "").toLowerCase();
      return !message.includes("nc majeures ou critiques") && !message.includes("rapport référencé");
    })
    .slice(0, 3);

  return (
    <div className="relative grid h-full items-center gap-4 overflow-hidden md:grid-cols-[minmax(0,1.9fr)_minmax(220px,0.65fr)]">
      <div className="flex h-full items-center justify-center px-4 py-1">
        <div className="flex w-full max-w-xl items-center justify-center gap-6">
          <div className="flex h-[74px] min-w-[220px] items-end justify-center gap-7 border-b border-gray-100 px-3">
            {data.map((item, index) => {
              const height = Math.max(((item.value || 0) / max) * 56, 7);
              return (
                <button
                  key={item.label}
                  type="button"
                  aria-label={`${item.label}: ${item.value}`}
                  className="flex h-full w-7 cursor-pointer items-end justify-center transition-transform duration-200 hover:scale-x-110"
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <span
                    className="block w-6 rounded-t-md transition-all duration-200"
                    style={{
                      height: `${height}px`,
                      background: COLORS[index % COLORS.length],
                      opacity: hovered === null || hovered === index ? 1 : 0.42,
                    }}
                  />
                </button>
              );
            })}
          </div>

          <div className="grid min-w-[150px] gap-1">
            {data.map((item, index) => (
              <div
                key={item.label}
                className="cursor-pointer rounded-md px-2 py-0.5 transition-colors hover:bg-gray-50"
                onMouseEnter={() => setHovered(index)}
                onMouseLeave={() => setHovered(null)}
              >
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }} />
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="h-full overflow-hidden border-l border-slate-200 pl-4 pr-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <p className="text-[11px] font-bold text-slate-800">Alertes urgentes</p>
        </div>
        <div className="space-y-1">
          {urgentAlerts.length === 0 ? (
            <p className="rounded-md border border-dashed border-slate-200 bg-white px-2 py-2 text-center text-[11px] text-slate-500">
              Aucune alerte urgente
            </p>
          ) : (
            urgentAlerts.map((alert) => (
              <div
                key={alert.message}
                className="truncate rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold leading-4 text-slate-600"
                title={alert.message}
              >
                {alert.message}
              </div>
            ))
          )}
        </div>
      </div>
      {active && (
        <ChartTooltip>
          <strong>{active.label}</strong> : {active.value} {plural("tâche", active.value)}
        </ChartTooltip>
      )}
    </div>
  );
}

function GaugeChart({ value }) {
  const [hovered, setHovered] = useState(false);
  const normalized = Math.min(Math.max(value || 0, 0), 100);
  const circumference = 263.89;
  const label = normalized >= 90 ? "Conforme" : normalized >= 75 ? "Quasi-conforme" : normalized >= 60 ? "En progression" : "Non-conforme";
  const badge = normalized >= 75 ? "bg-emerald-50 text-emerald-700" : normalized >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";

  return (
    <div
      className="relative flex h-full cursor-pointer flex-col items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <svg viewBox="0 0 120 120" className="h-[92px] w-[92px] xl:h-24 xl:w-24">
        <circle cx="60" cy="60" r="42" fill="none" stroke="#e5e7eb" strokeWidth="14" />
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="#6d28d9"
          strokeWidth={hovered ? "16" : "14"}
          strokeDasharray={`${(normalized / 100) * circumference} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          className="transition-all duration-200"
        />
        <text x="60" y="65" textAnchor="middle" className="fill-gray-950 text-base font-bold">
          {normalized}%
        </text>
      </svg>
      <span className={`-mt-1 rounded-full px-3 py-1 text-xs font-bold ${badge}`}>{label}</span>
      {hovered && (
        <ChartTooltip>
          <strong>Taux moyen</strong> : {normalized}% - {label}
        </ChartTooltip>
      )}
    </div>
  );
}

function Legend({ data }) {
  return (
    <div className="flex max-w-[130px] flex-col gap-2 xl:max-w-[150px]">
      {data.map((item, index) => (
        <span key={item.label} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color || COLORS[index % COLORS.length] }} />
          {item.label} ({item.value})
        </span>
      ))}
    </div>
  );
}

function ChartTooltip({ children }) {
  return (
    <div className="pointer-events-none absolute right-2 top-2 z-10 max-w-[220px] rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg">
      {children}
    </div>
  );
}

function buildFicheKpis(items) {
  const values = new Map((items || []).map((item) => [normalizeLabel(item.label), item.value || 0]));
  return [
    {
      label: "Soumises",
      value: values.get("soumises") || 0,
      icon: ClipboardCheck,
      iconClassName: "bg-blue-50 text-blue-600",
      valueClassName: "text-blue-600",
    },
    {
      label: "En cours d'audit",
      value: values.get("en cours daudit") || 0,
      icon: PieChart,
      iconClassName: "bg-amber-50 text-amber-600",
      valueClassName: "text-amber-600",
    },
    {
      label: "À réauditer",
      value: values.get("a reauditer") || 0,
      icon: RotateCcw,
      iconClassName: "bg-purple-50 text-purple-700",
      valueClassName: "text-purple-700",
    },
    {
      label: "Auditées / publiées",
      value: values.get("auditees publiees") || 0,
      icon: CheckCircle2,
      iconClassName: "bg-emerald-50 text-emerald-600",
      valueClassName: "text-emerald-600",
    },
  ];
}

function normalizeTaskLabels(items) {
  return (items || []).map((item) => ({
    ...item,
    label: cleanLabel(item.label),
  }));
}

function normalizeResultLabels(items) {
  return (items || []).map((item) => ({
    ...item,
    label: cleanLabel(item.label),
  }));
}

function cleanLabel(value) {
  const normalized = normalizeLabel(value);
  const labels = {
    "a faire": "À faire",
    terminees: "Terminées",
    "auditees publiees": "Auditées / publiées",
    "a reauditer": "À réauditer",
  };
  return labels[normalized] || value;
}

function normalizeLabel(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function plural(unit, value) {
  if (!unit) return "";
  return Number(value) > 1 ? `${unit}s` : unit;
}

function EmptyChart() {
  return (
    <div className="flex min-h-[120px] items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center text-xs text-slate-500">
      Aucune donnée disponible
    </div>
  );
}

function LoadingState() {
  return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-slate-500">Chargement du dashboard...</div>;
}

function ErrorState({ message }) {
  return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-red-600">{message}</div>;
}
