import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import qonformeLogo from "../../assets/logo_gray.svg";
import { useAuth } from "../../hooks/useAuth";
import { useSidebar } from "./SidebarContext";
import SidebarCalendar from "./SidebarCalendar";
import { SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_WIDTH, TOPBAR_HEIGHT } from "./layout.constants";
import { getSidebarItemsByRole } from "./sidebar.config";

const EASING = "cubic-bezier(0.4,0,0.2,1)";
const TRANSITION = `width 0.22s ${EASING}`;

// ── Logout confirmation modal ─────────────────────────────────────────────────
function LogoutModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="w-80 rounded-2xl bg-white shadow-2xl overflow-hidden"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="px-6 pt-6 pb-4">
          <h3 className="text-[15px] font-bold text-gray-900">Déconnexion</h3>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Voulez-vous vraiment vous déconnecter ?
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-[12px] font-semibold text-gray-600 hover:bg-gray-50 transition"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: "#58148E" }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isItemActive(item, pathname) {
  if (item.activePaths?.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

// ── Sidebar link (no children) ────────────────────────────────────────────────
function SidebarLink({ item, collapsed }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          "flex items-center rounded-md transition-all",
          collapsed ? "justify-center px-0 py-[5px]" : "gap-2.5 px-2.5 py-[5px]",
          isActive
            ? "bg-[linear-gradient(180deg,rgba(107,33,217,0.52),rgba(88,20,142,0.78))] text-[#F4B740] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
            : "text-violet-100 hover:bg-white/8 hover:text-white",
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
          {!collapsed && <span className="flex-1 text-[11px] font-medium">{item.label}</span>}
        </>
      )}
    </NavLink>
  );
}

// ── Sidebar dropdown (accordion) ──────────────────────────────────────────────
function SidebarDropdown({ item, isOpen, onToggle, collapsed, onExpand }) {
  const Icon = item.icon;
  const location = useLocation();
  const hasActiveChild = item.children.some((child) => isItemActive(child, location.pathname));

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onExpand}
        title={item.label}
        className={[
          "flex w-full items-center justify-center rounded-md py-[5px] transition-all hover:bg-white/8",
          hasActiveChild ? "text-[#F4B740]" : "text-violet-100",
        ].join(" ")}
      >
        <Icon
          className="h-[15px] w-[15px]"
          style={{ color: hasActiveChild ? "#F4B740" : "#F5EEFF" }}
          strokeWidth={1.8}
        />
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={[
          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-[5px] transition-all hover:bg-white/8 hover:text-white",
          hasActiveChild || isOpen ? "text-white" : "text-violet-100",
        ].join(" ")}
      >
        <Icon className="h-[15px] w-[15px] flex-shrink-0 text-[#F5EEFF]" strokeWidth={1.8} />
        <span className="flex-1 text-left text-[11px] font-medium">{item.label}</span>
        <ChevronDown
          className={[
            "h-3.5 w-3.5 text-violet-100 transition-transform duration-200",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {isOpen && (
        <div className="mt-0.5 space-y-0.5 pl-6">
          {item.children.map((child) => {
            const ChildIcon = child.icon;
            const active = isItemActive(child, location.pathname);
            return (
              <NavLink
                key={child.to}
                to={child.to}
                className={[
                  "flex items-center gap-2.5 rounded-md px-2.5 py-[5px] transition-all",
                  active
                    ? "bg-white/10 text-[#F4B740]"
                    : "text-violet-100/85 hover:bg-white/8 hover:text-white",
                ].join(" ")}
              >
                <ChildIcon
                  className="h-[13px] w-[13px] flex-shrink-0"
                  style={{ color: active ? "#F4B740" : "#EDE7FF" }}
                  strokeWidth={1.8}
                />
                <span className="text-[10.5px] font-medium">{child.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const { user, logout } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const navItems = getSidebarItemsByRole(user?.roles || []);
  const [openSection, setOpenSection] = useState(null);
  const [showLogout, setShowLogout] = useState(false);

  const handleSectionToggle = (label) => {
    setOpenSection((prev) => (prev === label ? null : label));
  };

  const sidebarW = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <>
      <aside
        style={{ width: sidebarW, transition: TRANSITION }}
        className="fixed left-0 top-0 z-20 flex h-screen flex-col border-r border-[#3A0B79] bg-[linear-gradient(180deg,#24005A_0%,#2D0B68_100%)] overflow-hidden"
      >
        {/* ── Logo + toggle ── */}
        <div
          className="relative flex shrink-0 items-center border-b border-white/12"
          style={{ height: TOPBAR_HEIGHT }}
        >
          <NavLink
            to="/accueil"
            className="flex items-center gap-2.5 px-3 min-w-0"
            title={collapsed ? "Qonform" : undefined}
          >
            <img src={qonformeLogo} alt="Qonform" className="h-6 w-6 shrink-0" />
            {!collapsed && (
              <span className="truncate text-[13px] font-semibold tracking-[-0.03em] text-white">
                Qonform
              </span>
            )}
          </NavLink>

          {/* Toggle button — sits on the right edge */}
          <button
            onClick={toggle}
            title={collapsed ? "Développer" : "Réduire"}
            className="absolute right-0 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-l-md bg-[#3A0B79]/80 text-violet-300 transition hover:bg-[#3A0B79] hover:text-white"
          >
            {collapsed
              ? <ChevronRight size={11} />
              : <ChevronLeft size={11} />}
          </button>
        </div>

        {/* ── Nav items ── */}
        <nav className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-2 space-y-0.5">
          {navItems.map((item) =>
            item.children ? (
              <SidebarDropdown
                key={item.label}
                item={item}
                isOpen={!collapsed && openSection === item.label}
                onToggle={() => handleSectionToggle(item.label)}
                collapsed={collapsed}
                onExpand={() => {
                  toggle();
                  setOpenSection(item.label);
                }}
              />
            ) : (
              <SidebarLink key={item.to} item={item} collapsed={collapsed} />
            )
          )}
        </nav>

        {/* ── Bottom: calendar + logout ── */}
        <div className="shrink-0 border-t border-white/10 px-1.5 pb-3 pt-2 space-y-2">
          {!collapsed && <SidebarCalendar />}

          <button
            onClick={() => setShowLogout(true)}
            title={collapsed ? "Se déconnecter" : undefined}
            className={[
              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-[5px] text-violet-100 transition-colors hover:bg-white/8 hover:text-white",
              collapsed ? "justify-center px-0" : "",
            ].join(" ")}
          >
            <LogOut className="h-[14px] w-[14px] shrink-0" />
            {!collapsed && <span className="text-[11px] font-medium">Se déconnecter</span>}
          </button>
        </div>
      </aside>

      {showLogout && (
        <LogoutModal
          onConfirm={() => { logout(); setShowLogout(false); }}
          onCancel={() => setShowLogout(false)}
        />
      )}
    </>
  );
}
