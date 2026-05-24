import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  ClipboardCheck,
  FileText,
  FolderOpen,
  GitBranch,
  LayoutDashboard,
  Map,
  Network,
  Settings,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../hooks/useAuth";
import { getProcessusList } from "../../api/processus.api";
import { auditApi } from "../../api/audit.api";
import { fetchDocuments } from "../../api/documents";
import { fetchAuditsTerrain } from "../../api/auditTerrain";

const CARD_BORDER = "#E9E1F8";
const PRIMARY = "#6B21D9";
const GOLD = "#F4B740";

const kpiCards = [
  { key: "processusDocumentes", label: "Processus document\u00e9s", icon: Network },
  { key: "fichesPubliees", label: "Fiches publi\u00e9es", icon: FileText },
  { key: "auditsConsultables", label: "Audits consultables", icon: ClipboardCheck },
  { key: "actionsAmelioration", label: "Actions d'am\u00e9lioration", icon: BarChart3 },
  { key: "documentsDisponibles", label: "Documents disponibles", icon: FolderOpen },
];

const certificationLinks = [
  { label: "Organigramme", to: "/organigramme", icon: GitBranch },
  { label: "Cartographie des processus", to: "/cartographie/processus", icon: Map },
  { label: "Interactions processus", to: "/cartographie/interactions", icon: Network },
  { label: "Support documentaire", to: "/documents", icon: FolderOpen },
];

const reviewItems = [
  { label: "Fiches processus publiees", to: "/cartographie/processus" },
  { label: "Audits terrain", to: "/audit/audits-terrain" },
  { label: "Actions correctives", to: "/actions" },
  { label: "Niveau de maturit\u00e9", to: "/niveau-maturite" },
];

export default function ExternalAuditorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    processusDocumentes: "—",
    fichesPubliees: "—",
    auditsConsultables: "—",
    actionsAmelioration: "—",
    documentsDisponibles: "—",
  });

  useEffect(() => {
    let mounted = true;

    async function loadOverview() {
      const [processusResult, fichesResult, auditsResult, documentsResult] =
        await Promise.allSettled([
          getProcessusList(),
          auditApi.getFiches(),
          fetchAuditsTerrain(),
          fetchDocuments({ page: 1, page_size: 1 }),
        ]);

      if (!mounted) return;

      setStats({
        processusDocumentes:
          processusResult.status === "fulfilled" ? processusResult.value.length : "—",
        fichesPubliees:
          fichesResult.status === "fulfilled"
            ? (fichesResult.value?.publiee_audit || []).length
            : "—",
        auditsConsultables:
          auditsResult.status === "fulfilled" ? auditsResult.value.length : "—",
        actionsAmelioration: "—",
        documentsDisponibles:
          documentsResult.status === "fulfilled"
            ? documentsResult.value?.pagination?.total_items ?? "—"
            : "—",
      });
    }

    loadOverview();
    return () => {
      mounted = false;
    };
  }, []);

  const userName = useMemo(() => {
    if (!user) return "";
    return `${user.prenom || ""} ${user.nom || ""}`.trim() || user.email;
  }, [user]);

  const userRole = user?.roles?.[0] || "Auditeur Externe";

  return (
    <AppLayout
      pageTitle="Espace auditeur externe"
      userName={userName}
      userRole={userRole}
    >
      <div className="space-y-4">
        <section className="rounded-[18px] border bg-white px-6 py-5 shadow-sm" style={{ borderColor: CARD_BORDER }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div
                className="mb-3 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]"
                style={{ backgroundColor: "#F5F0FF", color: PRIMARY }}
              >
                <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                Certification
              </div>
              <h1 className="text-[24px] font-semibold text-slate-900">
                Espace auditeur externe
              </h1>
              <p className="mt-1 text-[13px] text-slate-500">
                Vue de consultation d\u00e9di\u00e9e a l'audit de certification.
              </p>
            </div>

            <Link
              to="/parametres"
              className="inline-flex items-center gap-2 rounded-[12px] border px-3 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
              style={{ borderColor: CARD_BORDER }}
            >
              <Settings className="h-4 w-4" />
              Param\u00e8tres
            </Link>
          </div>

          <div className="mt-4 h-[3px] w-24 rounded-full" style={{ backgroundColor: GOLD }} />
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {kpiCards.map(({ key, label, icon: Icon }) => (
            <article
              key={key}
              className="rounded-[16px] border bg-white px-4 py-4 shadow-sm"
              style={{ borderColor: CARD_BORDER }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {label}
                  </p>
                  <p className="mt-5 text-[30px] font-bold leading-none text-slate-900">
                    {stats[key]}
                  </p>
                </div>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                  style={{ backgroundColor: "#F5F0FF", color: PRIMARY }}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </article>
          ))}
        </section>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
          <section className="rounded-[18px] border bg-white px-5 py-5 shadow-sm" style={{ borderColor: CARD_BORDER }}>
            <h2 className="text-[16px] font-semibold text-slate-900">Dossier de certification</h2>
            <p className="mt-1 text-[12px] text-slate-500">
              Acc\u00e8s direct aux \u00e9l\u00e9ments structurants du syst\u00e8me de management de la qualit\u00e9.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {certificationLinks.map(({ label, to, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="rounded-[14px] border bg-white px-4 py-4 transition hover:-translate-y-[1px] hover:shadow-sm"
                  style={{ borderColor: CARD_BORDER }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[12px]"
                    style={{ backgroundColor: "#F5F0FF", color: PRIMARY }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-[13px] font-semibold text-slate-800">{label}</p>
                  <p className="mt-1 text-[11px] text-slate-400">Consulter en lecture seule</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[18px] border bg-white px-5 py-5 shadow-sm" style={{ borderColor: CARD_BORDER }}>
            <h2 className="text-[16px] font-semibold text-slate-900">El\u00e9ments a examiner</h2>
            <p className="mt-1 text-[12px] text-slate-500">
              Parcours cible pour la revue des preuves, audits et indicateurs de maturit\u00e9.
            </p>

            <div className="mt-4 space-y-3">
              {reviewItems.map((item, index) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center justify-between rounded-[14px] border px-4 py-3 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50"
                  style={{ borderColor: CARD_BORDER }}
                >
                  <span>
                    <span className="mr-3 text-[11px] font-bold" style={{ color: PRIMARY }}>
                      0{index + 1}
                    </span>
                    {item.label}
                  </span>
                  <span className="text-[11px] font-semibold" style={{ color: PRIMARY }}>
                    Ouvrir
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-[18px] border bg-white px-5 py-5 shadow-sm" style={{ borderColor: CARD_BORDER }}>
          <h2 className="text-[16px] font-semibold text-slate-900">Mode consultation</h2>
          <p className="mt-2 max-w-3xl text-[13px] leading-6 text-slate-600">
            Ce profil est strictement r\u00e9serv\u00e9 a la consultation des preuves, documents et r\u00e9sultats utiles a l'audit de certification.
            Les fonctions de cr\u00e9ation, modification et suppression des donn\u00e9es internes restent d\u00e9sactiv\u00e9es.
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
