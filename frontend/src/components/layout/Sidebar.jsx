import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  ChevronDown,
  ClipboardList,
  FolderOpen,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Map,
  Settings,
  Users,
} from "lucide-react";
import qonformeLogo from "../../assets/icons/qonforme-logo.svg";
import { useAuth } from "../../hooks/useAuth";
import SidebarCalendar from "./SidebarCalendar";
import { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from "./layout.constants";

const navItems = [
  { label: "Tableau de bord", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Organigramme", icon: GitBranch, to: "/organigramme" },
  { label: "Cartographie", icon: Map, to: "/cartographie" },
  { label: "Planification", icon: Calendar, to: "/planification" },
  { label: "Documents", icon: FolderOpen, to: "/documents" },
  { label: "Niveau de maturite", icon: BarChart3, to: "/niveau-maturite" },
  { label: "Gestion des users", icon: Users, to: "/gestion-utilisateurs" },
  { label: "Paramètres", icon: Settings, to: "/parametres" },
];

const processusSubItems = [
  { label: "Fiches de processus", to: "/gestion-processus/fiches/nouveau" },
];

const activeLinkCls =
  "bg-[linear-gradient(180deg,rgba(107,33,217,0.52),rgba(88,20,142,0.78))] text-[#F4B740] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]";
const baseLinkCls = "text-violet-100 hover:bg-white/8 hover:text-white";

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  const isProcessusActive = processusSubItems.some((item) =>
    location.pathname.startsWith(item.to)
  );

  const [processusOpen, setProcessusOpen] = useState(isProcessusActive);

  return (
    <aside
      style={{ width: SIDEBAR_WIDTH }}
      className="sidebar fixed left-0 top-0 z-20 flex h-screen flex-col overflow-hidden border-r border-[#3A0B79] bg-[linear-gradient(180deg,#24005A_0%,#2D0B68_100%)] transition-colors dark:border-[#3A0B79]"
    >
      <NavLink
        to="/accueil"
        className="group flex items-center gap-3 border-b border-white/12 px-4 transition hover:bg-white/[0.04]"
        style={{ height: TOPBAR_HEIGHT }}
      >
        <div>
          <img
            src={qonformeLogo}
            alt="Qonforme"
            className="h-5 w-5 transition duration-200 group-hover:scale-[1.05]"
          />
        </div>
        <div className="min-w-0">
          <span className="block text-[13px] font-semibold tracking-[-0.03em] text-white">
            Qonform
          </span>
        </div>
      </NavLink>

      <div
        className="flex min-h-0 flex-1 flex-col justify-between gap-2 px-2 py-2"
        style={{ height: `calc(100vh - ${TOPBAR_HEIGHT}px)` }}
      >
        <nav className="space-y-0.5">
          {/* Gestion processus collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setProcessusOpen((v) => !v)}
              className={[
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-[5px] transition-all",
                isProcessusActive ? activeLinkCls : baseLinkCls,
              ].join(" ")}
            >
              <ClipboardList
                className="h-[15px] w-[15px] shrink-0"
                style={{ color: isProcessusActive ? "#F4B740" : "#F5EEFF" }}
                strokeWidth={1.8}
              />
              <span className="flex-1 text-left text-[11px] font-medium">
                Gestion processus
              </span>
              <ChevronDown
                size={12}
                className={[
                  "shrink-0 transition-transform duration-200",
                  processusOpen ? "rotate-180" : "",
                ].join(" ")}
                style={{ color: isProcessusActive ? "#F4B740" : "#C4B5FD" }}
              />
            </button>

            {processusOpen && (
              <div className="ml-[22px] mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
                {processusSubItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        "flex items-center gap-2 rounded-md px-2 py-[4px] text-[10.5px] font-medium transition-all",
                        isActive
                          ? "text-[#F4B740]"
                          : "text-violet-200/70 hover:text-white",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={[
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            isActive ? "bg-[#F4B740]" : "bg-violet-200/40",
                          ].join(" ")}
                        />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Autres items */}
          {navItems.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-2.5 rounded-md px-2.5 py-[5px] transition-all",
                  isActive ? activeLinkCls : baseLinkCls,
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className="h-[15px] w-[15px] flex-shrink-0"
                    style={{ color: isActive ? "#F4B740" : "#F5EEFF" }}
                    strokeWidth={1.8}
                  />
                  <span className="flex-1 text-[11px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1.5">
          <SidebarCalendar />

          <div className="space-y-1 border-t border-white/10 pt-1.5">
            <button
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-[5px] text-violet-100 transition-colors hover:bg-white/8 hover:text-white"
            >
              <LogOut className="h-[14px] w-[14px] flex-shrink-0" />
              <span className="text-[11px] font-medium">Se deconnecter</span>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
