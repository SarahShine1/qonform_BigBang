import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  FileText,
  Calendar,
  BookOpen,
  HelpCircle,
  LogOut,
  ChevronDown,
  ClipboardList,
} from "lucide-react";
import qonformeLogo      from "../../assets/icons/qonforme-logo.svg";

const navItems = [
  { label: "Dashboard",            icon: LayoutGrid,  to: "/dashboard" },
  { label: "Organigramme",         icon: Users,       to: "/organigram" },
  { label: "Gestion processus",    icon: FileText,    to: "/processus", hasDropdown: true },
  { label: "Planification",        icon: Calendar,    to: "/planification" },
  { label: "Mes audits",           icon: ClipboardList, to: "/mes-audits" },
  { label: "Support documentaire", icon: BookOpen,    to: "/documents" },
];

export default function Sidebar() {
  return (
    <aside
      style={{ width: 192 }}
      className="fixed top-0 left-0 h-screen bg-white border-r border-gray-100 flex flex-col z-20"
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-2 px-5 border-b border-gray-100" style={{ height: 56 }}>
        <div
          className="flex items-center justify-center  flex-shrink-0"
          style={{ width: 28, height: 28 }}
        >
           <img src={qonformeLogo} alt="Qonforme" style={{ width: 30, height: 30 }} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>Qonforme</span>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 py-3 px-3 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to, hasDropdown }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-purple-600 text-white"
                  : "text-gray-600 hover:bg-gray-50",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: isActive ? "#fff" : "#9ca3af" }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    flex: 1,
                    lineHeight: "1.2",
                    color: isActive ? "#fff" : "#4b5563",
                  }}
                >
                  {label}
                </span>
                {hasDropdown && (
                  <ChevronDown
                    className="w-3 h-3 flex-shrink-0"
                    style={{ color: isActive ? "rgba(255,255,255,0.7)" : "#9ca3af" }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom: Aide + Déconnexion ── */}
      <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <HelpCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#9ca3af" }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#4b5563" }}>Aide</span>
        </button>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
          <LogOut className="w-4 h-4 flex-shrink-0" style={{ color: "#9ca3af" }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "#4b5563" }}>Se déconnecter</span>
        </button>
      </div>
    </aside>
  );
}