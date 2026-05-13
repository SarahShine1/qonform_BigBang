import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Gauge,
  MoreVertical,
  PieChart,
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

  return (
    <AppLayout
      pageTitle="Dashboard Auditeur"
      userName={userName}
      userRole="Auditeur"
      contentClassName="bg-gray-50 px-4 py-3 pb-5"
    >
      <section className="grid gap-3 lg:grid-cols-3">
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

        <ChartCard title="Répartition des fiches processus" icon={BarChart3} compact>
          <HorizontalBars data={data?.fichesParStatut || []} unit="fiche" />
        </ChartCard>

        <ChartCard title="Taux moyen de conformité" icon={Gauge} compact>
          <GaugeChart value={conformity} />
        </ChartCard>
      </section>

      <section className="mt-3 grid gap-3 lg:grid-cols-3">
        <ChartCard title="Résultats des audits réalisés" icon={BarChart3} compact>
          <VerticalBars data={data?.resultatsAudits || []} unit="audit" compact />
        </ChartCard>
        <AlertsPanel alerts={data?.alertes || []} />
        <ChartCard title="État de mes tâches" icon={BarChart3} compact>
          <VerticalBars data={data?.tachesParStatut || []} unit="tâche" compact />
        </ChartCard>
      </section>
    </AppLayout>
  );
}

function ChartCard({ title, icon: Icon, children, tall = false, compact = false, small = false }) {
  const cardHeight = tall ? "h-[432px]" : compact ? "h-[258px]" : small ? "h-[210px]" : "h-[254px]";
  const bodyHeight = tall ? "h-[382px]" : compact ? "h-[208px]" : small ? "h-[160px]" : "h-[204px]";

  return (
    <section className={`${cardHeight} rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm`}>
      <div className="mb-2 flex items-center justify-between gap-2">
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
        <svg viewBox="0 0 120 120" className="h-28 w-28 xl:h-32 xl:w-32">
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

function HorizontalBars({ data, unit }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...data.map((item) => item.value || 0), 0);
  if (!max) return <EmptyChart />;
  const active = hovered === null ? null : data[hovered];

  return (
    <div className="relative flex h-full flex-col justify-center space-y-2 pb-2">
      {data.map((item, index) => (
        <div
          key={item.label}
          className="cursor-pointer"
          onMouseEnter={() => setHovered(index)}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="mb-0.5 flex justify-between text-[11px]">
            <span className="font-semibold text-slate-700">{item.label}</span>
            <span className="font-bold text-slate-500">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${((item.value || 0) / max) * 100}%`,
                background: COLORS[index % COLORS.length],
                opacity: hovered === null || hovered === index ? 1 : 0.38,
                transform: hovered === index ? "scaleY(1.18)" : "scaleY(1)",
              }}
            />
          </div>
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

function VerticalBars({ data, unit, compact = false }) {
  const [hovered, setHovered] = useState(null);
  const max = Math.max(...data.map((item) => item.value || 0), 0);
  if (!max) return <EmptyChart />;
  const active = hovered === null ? null : data[hovered];

  return (
    <div className="relative flex h-full items-end gap-3 border-b border-gray-100 pt-2">
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
              height: `${Math.max(((item.value || 0) / max) * (compact ? 82 : 118), 8)}px`,
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
      <svg viewBox="0 0 120 120" className="h-28 w-28 xl:h-32 xl:w-32">
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

function AlertsPanel({ alerts }) {
  const visibleAlerts = alerts.slice(0, 3);
  return (
    <section className="h-[258px] rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h2 className="text-sm font-bold text-gray-950">Alertes importantes</h2>
        </div>
        <MoreVertical className="h-4 w-4 text-slate-400" />
      </div>
      <div className="mt-2 space-y-2">
        {visibleAlerts.length === 0 ? <EmptyChart /> : visibleAlerts.map((alert) => <AlertItem key={alert.message} alert={alert} />)}
      </div>
    </section>
  );
}

function AlertItem({ alert }) {
  const styles = {
    danger: "border-red-100 bg-red-50 text-red-700",
    warning: "border-amber-100 bg-amber-50 text-amber-700",
    info: "border-blue-100 bg-blue-50 text-blue-700",
  };
  return <div className={`rounded-md border px-3 py-2 text-xs font-semibold leading-4 ${styles[alert.type] || styles.info}`}>{alert.message}</div>;
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
