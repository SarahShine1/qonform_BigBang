import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock,
  FileEdit,
  Layers,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { pilotageApi } from "../../api/pilotage.api";
import { useAuth } from "../../hooks/useAuth";
import {
  KpiCard,
  StatutDonut,
  NcBarChart,
  TachesCard,
  Timeline,
  ConformityBars,
} from "../../components/pilotage/pilote";

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-slate-500">
        Chargement du dashboard…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-red-600">
        {error}
      </div>
    );
  }

  const kpis                  = data?.kpis                  || {};
  const statutDistribution    = data?.statutDistribution     || [];
  const ncParProcessus        = data?.ncParProcessus         || [];
  const conformiteParProcessus = data?.conformiteParProcessus || [];
  const tachesAVenir          = data?.tachesAVenir           || [];
  const timeline              = data?.timeline               || [];

  return (
    <AppLayout
      pageTitle="Dashboard Pilote"
      userName={userName}
      userRole="Pilote"
      contentClassName="bg-gray-50 px-4 py-4 pb-6"
    >
      {/* Zone 1 — KPI cards */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={Layers}
          label="Processus pilotés"
          value={kpis.totalProcessus ?? 0}
          color="text-violet-700"
          bg="bg-violet-50"
          onClick={() => navigate("/cartographie/processus")}
        />
        <KpiCard
          icon={FileEdit}
          label="En brouillon"
          value={kpis.brouillon ?? 0}
          color="text-slate-600"
          bg="bg-slate-100"
          onClick={() => navigate("/cartographie/processus?statut=Brouillon")}
        />
        <KpiCard
          icon={Clock}
          label="En attente"
          value={kpis.enAttente ?? 0}
          color="text-amber-600"
          bg="bg-amber-50"
          onClick={() => navigate("/cartographie/processus?statut=En_revision")}
        />
        <KpiCard
          icon={CheckCircle2}
          label="Publiées"
          value={kpis.publiee ?? 0}
          color="text-emerald-600"
          bg="bg-emerald-50"
          onClick={() => navigate("/cartographie/processus?statut=Publiee")}
        />
      </section>

      {/* Zone 2 — Donut + Tâches */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StatutDonut data={statutDistribution} />
        </div>
        <TachesCard taches={tachesAVenir} onNavigate={() => navigate("/planification")} />
      </div>

      {/* Zone 3 — NC bar chart + Timeline */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NcBarChart data={ncParProcessus} />
        </div>
        <Timeline events={timeline} />
      </div>

      {/* Zone 4 — Conformity per processus */}
      <div className="mt-4">
        <ConformityBars data={conformiteParProcessus} />
      </div>
    </AppLayout>
  );
}
