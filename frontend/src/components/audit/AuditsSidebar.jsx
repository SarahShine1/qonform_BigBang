import { useState } from "react"
import { NavLink } from "react-router-dom"
import {
  ChevronDown,
  ChevronUp,
  FileText,
  HelpCircle,
  LayoutGrid,
  LogOut,
  List,
  ClipboardList,
} from "lucide-react"

export default function AuditsSidebar() {
  const [auditsOpen, setAuditsOpen] = useState(true)

  return (
    <aside className="w-[200px] shrink-0 self-stretch min-h-[min(100vh-8rem,900px)] bg-white border border-gray-100 rounded-xl flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-4 flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6366f1] to-[#06b6d4] flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-white" />
        </div>
        <span className="font-semibold text-gray-900 text-lg">Qonforme</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {/* Dashboard */}
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                  isActive ? "bg-[#6366f1] text-white" : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <LayoutGrid className="w-5 h-5" />
              <span>Dashboard</span>
            </NavLink>
          </li>

          {/* Taches */}
          <li>
            <NavLink
              to="/taches"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                  isActive ? "bg-[#6366f1] text-white" : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <List className="w-5 h-5" />
              <span>Taches</span>
            </NavLink>
          </li>

          {/* Mes audits - Active with dropdown */}
          <li>
            <button
              onClick={() => setAuditsOpen(!auditsOpen)}
              className="flex items-center justify-between w-full px-3 py-2.5 bg-[#6366f1] text-white rounded-lg text-sm"
            >
              <div className="flex items-center gap-3">
                <ClipboardList className="w-5 h-5" />
                <span>Mes audits</span>
              </div>
              {auditsOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {auditsOpen && (
              <ul className="mt-1 ml-4 space-y-1">
                <li>
                  <NavLink
                    to="/mes-audits/planifies"
                    className="block px-3 py-2 text-gray-500 hover:text-gray-700 text-sm"
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
                    <span className="w-2 h-2 rounded-full bg-[#6366f1]"></span>
                    Audits clôturés
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* Fiches processus */}
          <li>
            <NavLink
              to="/processus"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
                  isActive ? "bg-[#6366f1] text-white" : "text-gray-600 hover:bg-gray-50"
                }`
              }
            >
              <FileText className="w-5 h-5" />
              <span>Fiches processus</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Bottom links */}
      <div className="px-3 pb-4 space-y-1">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Help</span>
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </a>
      </div>
    </aside>
  )
}