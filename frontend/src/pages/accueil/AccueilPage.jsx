import AppLayout from "../../components/layout/AppLayout";
import DemingWheel from "../../components/accueil/DemingWheel";
import TodayTasksCard from "../../components/accueil/TodayTasksCard";
import AuditResourcesCard from "../../components/accueil/AuditResourcesCard";
import { useAuth } from "../../hooks/useAuth";

export default function AccueilPage() {
  const { user } = useAuth();
  const userName = `${user?.prenom || ""} ${user?.nom || ""}`.trim() || user?.email || "Utilisateur";
  const userRole = user?.roles?.[0] || "CAQ";

  return (
    <AppLayout
      pageTitle="Accueil"
      userName={userName}
      userRole={userRole}
      contentClassName="overflow-hidden"
    >
      <div className="accueil-content grid h-full min-h-0 grid-rows-[auto_minmax(210px,236px)_minmax(160px,176px)] gap-2.5 overflow-hidden">
        <section className="rounded-[12px] border border-[#EEE7FA] bg-[radial-gradient(circle_at_top_left,rgba(107,33,217,0.08),transparent_30%),linear-gradient(180deg,#FFFFFF_0%,#FBF9FF_100%)] px-4 py-2.5 shadow-[0_12px_24px_rgba(60,16,120,0.05)]">
          <h1 className="m-0 text-[clamp(23px,1.8vw,27px)] font-semibold tracking-[-0.04em] text-slate-900">
            Bienvenue sur <span className="text-[#58148E]">Qonform</span>
          </h1>
          <p className="mt-0.5 max-w-3xl text-[13px] leading-[18px] text-slate-500">
            {"Votre espace d'aide a la pr\u00E9paration de la certification ISO 9001:2015"}
          </p>
        </section>

        <div className="min-h-0 overflow-hidden">
          <DemingWheel />
        </div>

        <section className="grid min-h-0 gap-2.5 lg:grid-cols-2">
          <TodayTasksCard />
          <AuditResourcesCard />
        </section>
      </div>
    </AppLayout>
  );
}
