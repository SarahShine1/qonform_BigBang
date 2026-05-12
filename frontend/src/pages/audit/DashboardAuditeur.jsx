import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  Gauge,
  PieChart,
  RefreshCw,
  TrendingUp,
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

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const kpis = data?.kpis || {};
  const conformity = data?.tauxMoyenConformite || 0;

  return (
    <AppLayout
      pageTitle="Dashboard Auditeur"
      userName={userName}
      userRole="Auditeur"
      contentClassName="bg-gray-50 px-4 py-4 pb-6"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-500">Module audit</p>
          <h1 className="mt-1 text-xl font-bold text-gray-950">Dashboard auditeur</h1>
          <p className="mt-1 text-xs text-slate-500">
            Vue de pilotage des fiches, audits, taches et resultats de conformite.
          </p>
        </div>
        <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
          Couverture {kpis.couverture || 0}%
        </span>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <KpiCard icon={CheckCircle2} title="Processus audites" value={`${kpis.processusAudites || 0} / ${kpis.totalProcessus || 0}`} hint={`${kpis.couverture || 0}% de couverture`} tone="emerald" />
        <KpiCard icon={ClipboardCheck} title="Fiches a auditer" value={kpis.fichesAAuditer || 0} hint="Statut Soumise" tone="blue" />
        <KpiCard icon={RefreshCw} title="Fiches a reauditer" value={kpis.fichesAReauditer || 0} hint="Champ revue actif" tone="amber" />
        <KpiCard icon={Clock3} title="Audits en cours" value={kpis.auditsEnCours || 0} hint="En revision" tone="purple" />
        <KpiCard icon={AlertTriangle} title="Taches en retard" value={kpis.tachesEnRetard || 0} hint="Deadline depassee" tone="red" />
        <KpiCard icon={TrendingUp} title="Taches prioritaires" value={kpis.tachesPrioritaires || 0} hint="Priorite haute" tone="slate" />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <ChartCard title="Progression des processus audites" icon={PieChart}>
          <DonutChart
            data={[
              { label: "Audites", value: data?.progressionAudits?.audites || 0, color: COLORS[0] },
              { label: "Restants", value: data?.progressionAudits?.restants || 0, color: "#e5e7eb" },
            ]}
            center={`${data?.progressionAudits?.pourcentage || 0}%`}
            caption={`${data?.progressionAudits?.audites || 0} / ${kpis.totalProcessus || 0} processus audites`}
          />
        </ChartCard>

        <ChartCard title="Repartition des fiches processus" icon={BarChart3}>
          <HorizontalBars data={data?.fichesParStatut || []} />
        </ChartCard>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <ChartCard title="Etat de mes taches" icon={BarChart3}>
          <VerticalBars data={data?.tachesParStatut || []} />
        </ChartCard>
        <ChartCard title="Taches par priorite" icon={PieChart}>
          <DonutChart data={withColors(data?.tachesParPriorite || [])} />
        </ChartCard>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <ChartCard title="Taux moyen de conformite" icon={Gauge}>
          <GaugeChart value={conformity} />
        </ChartCard>
        <ChartCard title="Resultats des audits realises" icon={BarChart3}>
          <VerticalBars data={data?.resultatsAudits || []} />
        </ChartCard>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <ChartCard title="Gravite des non-conformites" icon={PieChart}>
          <DonutChart data={withColors(data?.ncParGravite || [])} />
        </ChartCard>
        <ChartCard title="Conformite par axe ISO 9001" icon={TrendingUp}>
          <RadarChart data={data?.conformiteParClause || []} />
        </ChartCard>
      </section>

      <section className="mt-4">
        <ChartCard title="Evolution des audits finalises" icon={TrendingUp}>
          <LineChart data={data?.evolutionAudits || []} />
        </ChartCard>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <TasksTable tasks={data?.tachesPlanifiees || []} />
        <div className="space-y-4">
          <AlertsPanel alerts={data?.alertes || []} />
          <ReportsPanel reports={data?.rapportsRecents || []} />
        </div>
      </section>
    </AppLayout>
  );
}

function KpiCard({ icon: Icon, title, value, hint, tone }) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    purple: "bg-purple-50 text-purple-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-700",
  };
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className={`flex h-8 w-8 items-center justify-center rounded-md ${tones[tone] || tones.purple}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-3 text-[11px] font-semibold uppercase text-slate-400">{title}</p>
      <p className="mt-1 text-xl font-bold text-gray-950">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </article>
  );
}

function ChartCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-purple-700" />
        <h2 className="text-sm font-bold text-gray-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DonutChart({ data, center, caption }) {
  const total = data.reduce((sum, item) => sum + Number(item.value || 0), 0);
  if (!total) return <EmptyChart />;
  let offset = 25;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 120" className="h-44 w-44">
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
              strokeWidth="16"
              strokeDasharray={`${dash} ${263.89 - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
            />
          );
          offset -= dash;
          return segment;
        })}
        {center && (
          <text x="60" y="65" textAnchor="middle" className="fill-gray-950 text-xl font-bold">
            {center}
          </text>
        )}
      </svg>
      {caption && <p className="-mt-2 text-xs font-semibold text-slate-600">{caption}</p>}
      <Legend data={data} />
    </div>
  );
}

function HorizontalBars({ data }) {
  const max = Math.max(...data.map((item) => item.value || 0), 0);
  if (!max) return <EmptyChart />;
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-semibold text-slate-700">{item.label}</span>
            <span className="font-bold text-slate-500">{item.value}</span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full"
              style={{ width: `${((item.value || 0) / max) * 100}%`, background: COLORS[index % COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function VerticalBars({ data }) {
  const max = Math.max(...data.map((item) => item.value || 0), 0);
  if (!max) return <EmptyChart />;
  return (
    <div className="flex h-56 items-end gap-3 border-b border-gray-100 pt-4">
      {data.map((item, index) => (
        <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
          <div className="text-xs font-bold text-slate-600">{item.value}</div>
          <div
            className="w-full max-w-[54px] rounded-t-md"
            style={{ height: `${Math.max(((item.value || 0) / max) * 150, 8)}px`, background: COLORS[index % COLORS.length] }}
          />
          <div className="h-8 text-center text-[11px] font-semibold leading-4 text-slate-500">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

function GaugeChart({ value }) {
  const normalized = Math.min(Math.max(value || 0, 0), 100);
  const circumference = 263.89;
  const label = normalized >= 90 ? "Conforme" : normalized >= 75 ? "Quasi-conforme" : normalized >= 60 ? "En progression" : "Non-conforme";
  const badge = normalized >= 75 ? "bg-emerald-50 text-emerald-700" : normalized >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700";
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 120 120" className="h-44 w-44">
        <circle cx="60" cy="60" r="42" fill="none" stroke="#e5e7eb" strokeWidth="14" />
        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="#6d28d9"
          strokeWidth="14"
          strokeDasharray={`${(normalized / 100) * circumference} ${circumference}`}
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="65" textAnchor="middle" className="fill-gray-950 text-xl font-bold">
          {normalized}%
        </text>
      </svg>
      <span className={`-mt-2 rounded-full px-3 py-1 text-xs font-bold ${badge}`}>{label}</span>
    </div>
  );
}

function RadarChart({ data }) {
  const size = 260;
  const center = size / 2;
  const radius = 86;
  const points = data.map((item, index) => {
    const angle = (Math.PI * 2 * index) / data.length - Math.PI / 2;
    const valueRadius = radius * ((item.value || 0) / 100);
    return {
      ...item,
      x: center + Math.cos(angle) * valueRadius,
      y: center + Math.sin(angle) * valueRadius,
      labelX: center + Math.cos(angle) * (radius + 28),
      labelY: center + Math.sin(angle) * (radius + 28),
    };
  });
  if (!data.length) return <EmptyChart />;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-[300px] w-full max-w-[420px]">
      {[0.25, 0.5, 0.75, 1].map((level) => (
        <polygon
          key={level}
          points={data
            .map((_, index) => {
              const angle = (Math.PI * 2 * index) / data.length - Math.PI / 2;
              return `${center + Math.cos(angle) * radius * level},${center + Math.sin(angle) * radius * level}`;
            })
            .join(" ")}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      ))}
      <polygon points={points.map((point) => `${point.x},${point.y}`).join(" ")} fill="rgba(109,40,217,0.18)" stroke="#6d28d9" strokeWidth="2" />
      {points.map((point) => (
        <text key={point.label} x={point.labelX} y={point.labelY} textAnchor="middle" className="fill-slate-500 text-[8px] font-semibold">
          {point.label.replace("§", "")}
        </text>
      ))}
    </svg>
  );
}

function LineChart({ data }) {
  if (!data.length) return <EmptyChart />;
  const width = 760;
  const height = 220;
  const max = Math.max(...data.map((item) => item.value || 0), 1);
  const points = data.map((item, index) => {
    const x = 40 + (index * (width - 80)) / Math.max(data.length - 1, 1);
    const y = height - 36 - ((item.value || 0) / max) * 150;
    return { ...item, x, y };
  });
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
      <line x1="40" y1={height - 36} x2={width - 30} y2={height - 36} stroke="#e5e7eb" />
      <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} fill="none" stroke="#6d28d9" strokeWidth="3" />
      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="4" fill="#6d28d9" />
          <text x={point.x} y={height - 14} textAnchor="middle" className="fill-slate-500 text-[11px] font-semibold">
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function TasksTable({ tasks }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-sm font-bold text-gray-950">Mes taches planifiees</h2>
      </div>
      {tasks.length === 0 ? (
        <EmptyChart />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-left font-bold text-slate-500">
                <th className="px-3 py-2">Tache</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Priorite</th>
                <th className="px-3 py-2">Statut</th>
                <th className="px-3 py-2">Echeance</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-semibold text-slate-800">{task.intitule}</td>
                  <td className="px-3 py-2 text-slate-500">{task.type}</td>
                  <td className="px-3 py-2"><Badge value={task.priorite} /></td>
                  <td className="px-3 py-2"><Badge value={task.en_retard ? "En retard" : task.statut} /></td>
                  <td className="px-3 py-2 text-slate-500">{formatDate(task.date_fin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function AlertsPanel({ alerts }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-gray-950">Alertes importantes</h2>
      <div className="mt-3 space-y-2">
        {alerts.length === 0 ? <EmptyChart /> : alerts.map((alert) => <AlertItem key={alert.message} alert={alert} />)}
      </div>
    </section>
  );
}

function ReportsPanel({ reports }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-gray-950">Rapports recents</h2>
      <div className="mt-3 space-y-2">
        {reports.length === 0 ? (
          <EmptyChart />
        ) : (
          reports.map((report) => (
            <div key={report.id_version} className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-gray-950">{report.nom}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{report.processus}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatDate(report.date)} - {report.taux}%</p>
                </div>
                <button
                  type="button"
                  onClick={() => auditApi.downloadReport(report.id_version, report.nom)}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-purple-200 bg-white px-2 text-[11px] font-bold text-purple-700 hover:bg-purple-50"
                >
                  <Download className="h-3 w-3" />
                  Voir
                </button>
              </div>
            </div>
          ))
        )}
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
  return <div className={`rounded-md border px-3 py-2 text-xs font-semibold ${styles[alert.type] || styles.info}`}>{alert.message}</div>;
}

function Badge({ value }) {
  const text = value || "-";
  const normalized = text.toLowerCase();
  const style = normalized.includes("retard") || normalized.includes("haute")
    ? "bg-red-50 text-red-700"
    : normalized.includes("cours") || normalized.includes("moyenne")
      ? "bg-amber-50 text-amber-700"
      : normalized.includes("termin") || normalized.includes("basse")
        ? "bg-emerald-50 text-emerald-700"
        : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${style}`}>{text}</span>;
}

function Legend({ data }) {
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2">
      {data.map((item, index) => (
        <span key={item.label} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color || COLORS[index % COLORS.length] }} />
          {item.label} ({item.value})
        </span>
      ))}
    </div>
  );
}

function withColors(data) {
  return data.map((item, index) => ({ ...item, color: COLORS[index % COLORS.length] }));
}

function EmptyChart() {
  return (
    <div className="flex min-h-[150px] items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-4 text-center text-xs text-slate-500">
      Aucune donnee disponible pour le moment
    </div>
  );
}

function LoadingState() {
  return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-slate-500">Chargement du dashboard...</div>;
}

function ErrorState({ message }) {
  return <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-red-600">{message}</div>;
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR").format(new Date(value));
}
