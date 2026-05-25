import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../hooks/useAuth";
import { getDashboardDG } from "./dashboardDGService";

function parseCount(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.includes("/")) {
    return Number(value.split("/")[0]) || 0;
  }
  return Number(value) || 0;
}

function KpiIcon({ type, orange = false }) {
  const color = orange ? "#f97316" : "#641ab5";

  const icons = {
    process: <path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />,
    audit: <path d="M9 5h6M9 9h6M9 13h3M7 3h10a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2z" />,
    iso: <path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM8.5 14l-1.5 7 5-3 5 3-1.5-7" />,
    layers: <path d="M12 2 2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5" />,
  };

  return (
    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${orange ? "bg-orange-50" : "bg-violet-50"}`}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {icons[type]}
      </svg>
    </div>
  );
}

function KpiCard({ type, title, value, badge, orange = false, onClick }) {
  const handleKeyDown = (e) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={handleKeyDown}
      onClick={onClick}
      className={`relative flex h-[86px] items-center gap-3 overflow-hidden rounded-2xl border border-violet-100 bg-white px-4 shadow-sm ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition" : ""}`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 ${orange ? "bg-orange-500" : "bg-[#641ab5]"}`} />
      <KpiIcon type={type} orange={orange} />
      <div>
        <p className="text-[12px] font-bold text-slate-900">{title}</p>
        <p className={`mt-0.5 text-[22px] font-bold ${orange ? "text-orange-500" : "text-[#641ab5]"}`}>{value}</p>
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${orange ? "bg-orange-50 text-orange-500" : "bg-violet-50 text-[#641ab5]"}`}>
          {badge}
        </span>
      </div>
    </div>
  );
}

function ProgressGauge({ value = 0 }) {
  const safe = Number(value) || 0;

  return (
    <div className="h-[235px] rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex justify-between">
        <h2 className="text-[15px] font-bold text-slate-900">Avancement global</h2>
        <span className="rounded-lg bg-violet-50 px-2 py-1 text-[10px] font-bold text-[#641ab5]">Projet qualité</span>
      </div>

      <div className="flex justify-center">
        <div className="flex h-[135px] w-[135px] items-center justify-center rounded-full" style={{ background: `conic-gradient(#641ab5 ${safe * 3.6}deg, #efe7ff 0deg)` }}>
          <div className="flex h-[92px] w-[92px] flex-col items-center justify-center rounded-full bg-white">
            <span className="text-[30px] font-bold text-[#641ab5]">{safe}%</span>
            <span className="text-[11px] text-slate-500">réalisé</span>
          </div>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-violet-50">
        <div className="h-2 rounded-full bg-gradient-to-r from-[#641ab5] to-violet-400" style={{ width: `${safe}%` }} />
      </div>
    </div>
  );
}

function CartographieQualite({ data }) {
  const total = parseCount(data.processus_actifs);
  const publies = parseCount(data.processus_publies);
  const taux = total > 0 ? Math.round((publies / total) * 100) : 0;

  return (
    <div className="h-[235px] rounded-2xl border border-orange-200 bg-white p-4 shadow-sm">
      <div className="mb-1 flex justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-slate-900">Cartographie qualité</h2>
          <p className="mt-0.5 text-[10px] text-slate-500">Processus publiés / Total processus × 100</p>
        </div>
        <span className="rounded-lg bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-500">{publies} / {total}</span>
      </div>

      <div className="relative mx-auto mt-1 h-[115px] w-[220px] overflow-hidden">
        <div className="absolute left-0 top-0 h-[220px] w-[220px] rounded-full" style={{ background: `conic-gradient(from 270deg, #fb923c ${taux * 1.8}deg, #eee7ff 0deg)` }} />
        <div className="absolute left-[24px] top-[24px] h-[172px] w-[172px] rounded-full bg-white" />
        <div className="absolute bottom-0 left-0 h-[52px] w-full bg-white" />

        <div className="absolute left-1/2 top-[55px] -translate-x-1/2 text-center">
          <p className="text-[30px] font-bold text-orange-500">{taux}%</p>
          <p className="text-[11px] font-medium text-orange-500">{taux === 100 ? "Cartographie complète" : "Cartographie en cours"}</p>
        </div>

        <span className="absolute bottom-1 left-0 text-[10px] font-bold text-slate-500">0%</span>
        <span className="absolute bottom-1 right-0 text-[10px] font-bold text-slate-500">100%</span>
      </div>

     
    </div>
  );
}

function MaturiteGlobale({ value = "0/5", score = 0 }) {
    return (
    <div className="h-[235px] rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex justify-between">
        <h2 className="text-[15px] font-bold text-slate-900">Maturité globale</h2>
        <span className="rounded-lg bg-orange-50 px-2 py-1 text-[11px] font-bold text-orange-500">Niveau {value}</span>
      </div>

      <div className="flex justify-center">
        <div className="flex h-[135px] w-[135px] items-center justify-center rounded-full" style={{ background: `conic-gradient(#fb923c 0deg ${Number(score || 0) * 3.6}deg, #eee7ff ${Number(score || 0) * 3.6}deg 360deg)` }}>
          <div className="flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-white">
            <span className="text-[26px] font-bold text-orange-500">{value}</span>
            <span className="text-[11px] text-slate-500">maturité</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnnualChart({ current = 0 }) {
  const safe = Number(current) || 0;
  const years = [
    { year: "2023", value: 35 },
    { year: "2024", value: 48 },
    { year: "2025", value: 61 },
    { year: "2026", value: safe },
  ];

  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <div className="mb-2 flex justify-between">
        <h2 className="text-[15px] font-bold text-slate-900">Comparaison annuelle — Avancement global</h2>
        <span className="rounded-lg bg-violet-50 px-2 py-1 text-[11px] font-bold text-[#641ab5]">Évolution</span>
      </div>

      <div className="flex h-[130px] items-end gap-12 border-b border-slate-200 px-12 pb-3">
        {years.map((item, index) => (
          <div key={item.year} className="flex flex-1 flex-col items-center gap-1">
            <span className={`text-[12px] font-bold ${index === 3 ? "text-orange-500" : "text-slate-900"}`}>{item.value}%</span>
            <div className={`w-[58px] rounded-t-xl ${index === 3 ? "bg-gradient-to-t from-orange-500 to-orange-300" : "bg-gradient-to-t from-violet-300 to-violet-100"}`} style={{ height: `${item.value * 0.9}px` }} />
            <span className="text-[11px] text-slate-500">{item.year}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardDG() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      const result = await getDashboardDG();
      setData(result);
    }
    loadDashboard();
  }, []);

  if (!data) return null;

  const userName = user ? `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email : "";
  const userRole = user?.roles?.[0] || "DG";

  return (
    <AppLayout pageTitle="Dashboard Direction Générale" userName={userName} userRole={userRole} contentClassName="bg-[#f8fafc] overflow-hidden">
      <div className="h-full  px-5 ">
        <div className="mb-3">
          <h1 className="text-[22px] font-bold text-slate-900">Tableau de bord Direction Générale</h1>
          <p className="text-[13px] text-slate-500">Vue exécutive de suivi du projet qualité.</p>
            

        </div>

        <div className="grid grid-cols-4 gap-3">
          <KpiCard
            type="process"
            title="Processus publiés"
            value={data.processus_publies}
            badge="Validés"
            onClick={() => navigate("/cartographie/processus?statut=Publiee")}
          />
          <KpiCard
            type="audit"
            title="Audits clôturés"
            value={data.audits_clotures}
            badge="Réalisés"
            orange
            onClick={() => navigate("/audit/audits-terrain?statut=cloture")}
          />
          <KpiCard
            type="iso"
            title="Conformité ISO"
            value={`${Number(data.conformite_iso || 0)}%`}
            badge="Taux global"
            onClick={() => navigate("/cartographie/canevas-fiche")}
          />
          <KpiCard
            type="layers"
            title="Processus actifs"
            value={data.processus_actifs}
            badge="Total actifs"
            orange
            onClick={() => navigate("/cartographie/processus")}
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <ProgressGauge value={data.avancement_global} />
          <CartographieQualite data={data} />
          <MaturiteGlobale />
        </div>

        <div className="mt-3">
          <AnnualChart current={data.avancement_global} />
        </div>
      </div>
    </AppLayout>
  );
}