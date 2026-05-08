import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  HelpCircle,
  LayoutGrid,
  List,
  LogOut,
} from "lucide-react";

export default function AuditsSidebar() {
  const [auditsOpen, setAuditsOpen] = useState(true);

  return (
    <aside className="min-h-[min(100vh-8rem,900px)] w-[188px] shrink-0 self-stretch rounded-[18px] border border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#06b6d4]">
          <div className="h-4 w-4 rounded-full border-2 border-white" />
        </div>
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Qonforme</span>
      </div>

      <nav className="flex-1 px-3 py-3">
        <ul className="space-y-1">
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? "bg-[#6366f1] text-white"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`
              }
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Dashboard</span>
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/taches"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? "bg-[#6366f1] text-white"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`
              }
            >
              <List className="h-4 w-4" />
              <span>Taches</span>
            </NavLink>
          </li>

          <li>
            <button
              onClick={() => setAuditsOpen((current) => !current)}
              className="flex w-full items-center justify-between rounded-lg bg-[#6366f1] px-3 py-2 text-sm text-white"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="h-4 w-4" />
                <span>Mes audits</span>
              </div>
              {auditsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {auditsOpen ? (
              <ul className="ml-4 mt-1 space-y-1">
                <li>
                  <NavLink
                    to="/mes-audits/planifies"
                    className="block px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Audits planifiés
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/mes-audits/clotures"
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 text-sm ${
                        isActive
                          ? "text-[#6366f1] dark:text-violet-300"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      }`
                    }
                  >
                    <span className="h-2 w-2 rounded-full bg-[#6366f1]" />
                    Audits clôturés
                  </NavLink>
                </li>
              </ul>
            ) : null}
          </li>

          <li>
            <NavLink
              to="/processus"
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                  isActive
                    ? "bg-[#6366f1] text-white"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`
              }
            >
              <FileText className="h-4 w-4" />
              <span>Fiches processus</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="space-y-1 px-3 pb-4">
        <a
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Help</span>
        </a>
        <a
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </a>
      </div>
    </aside>
  );
}
