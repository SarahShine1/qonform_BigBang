import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../hooks/useAuth";

export default function ModulePlaceholderPage({ pageTitle, title, description }) {
  const { user } = useAuth();
  const userName = `${user?.prenom || ""} ${user?.nom || ""}`.trim() || user?.email || "Utilisateur";
  const userRole = user?.roles?.[0] || "CAQ";

  return (
    <AppLayout pageTitle={pageTitle} userName={userName} userRole={userRole}>
      <section className="rounded-[28px] border border-[#E9E1F8] bg-white px-6 py-8 shadow-[0_18px_42px_rgba(60,16,120,0.05)]">
        <h1 className="m-0 text-[28px] font-semibold tracking-[-0.03em] text-slate-900">{title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">{description}</p>
      </section>
    </AppLayout>
  );
}
