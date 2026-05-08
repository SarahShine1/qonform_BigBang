import { NavLink } from "react-router-dom";
import {
  ClipboardList,
  FileText,
  HelpCircle,
  LayoutGrid,
  List,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export default function AuditsSidebar({ collapsed = false, onToggle }) {
  return (
    <aside
      className={`flex min-h-screen shrink-0 flex-col border-r border-gray-100 bg-white transition-all duration-200 ${
        collapsed ? "w-[72px]" : "w-[220px]"
      }`}
    >
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#06b6d4]">
          <div className="h-5 w-5 rounded-full border-2 border-white" />
        </div>
        {!collapsed && <span className="text-lg font-semibold text-gray-900">Qonforme</span>}
        <button
          type="button"
          onClick={onToggle}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-50"
          aria-label={collapsed ? "Ouvrir la navigation" : "Fermer la navigation"}
          title={collapsed ? "Ouvrir" : "Fermer"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          <NavItem to="/dashboard" icon={LayoutGrid} label="Dashboard" collapsed={collapsed} />
          <NavItem to="/taches" icon={List} label="Tâches" collapsed={collapsed} />

          <li>
            <NavLink
              to="/mes-audits/execution/AUD-2026-001"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                  isActive ? "bg-[#6366f1] text-white" : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <ClipboardList className="h-5 w-5" />
              {!collapsed && <span>Mes audits</span>}
            </NavLink>
            {!collapsed && <ul className="ml-4 mt-1 space-y-1">
              <li>
                <NavLink
                  to="/mes-audits/planifies"
                  className="block px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Audits planifiés
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/mes-audits/clotures"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 text-sm ${
                      isActive ? "text-[#6366f1]" : "text-gray-500 hover:text-gray-700"
                    }`
                  }
                >
                  <span className="h-2 w-2 rounded-full bg-[#6366f1]" />
                  Audits clôturés
                </NavLink>
              </li>
            </ul>}
          </li>

          <NavItem to="/processus" icon={FileText} label="Fiches processus" collapsed={collapsed} />
        </ul>
      </nav>

      <div className="space-y-1 px-3 pb-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50" title="Aide">
          <HelpCircle className="h-5 w-5" />
          {!collapsed && <span>Aide</span>}
        </button>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50" title="Déconnexion">
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}

function NavItem({ to, icon: Icon, label, collapsed }) {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
            isActive ? "bg-[#6366f1] text-white" : "text-gray-600 hover:bg-gray-50"
          }`
        }
        title={label}
      >
        <Icon className="h-5 w-5" />
        {!collapsed && <span>{label}</span>}
      </NavLink>
    </li>
  );
}
