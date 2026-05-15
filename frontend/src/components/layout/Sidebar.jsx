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
import qonformeLogo from "../../assets/logo_gray.svg";
import { useAuth } from "../../hooks/useAuth";
import SidebarCalendar from "./SidebarCalendar";
import { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from "./layout.constants";
import { getSidebarItemsByRole } from "./sidebar.config";

function SidebarLink({ item }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2.5 rounded-md px-2.5 py-[5px] transition-all",
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
          <span className="flex-1 text-[11px] font-medium">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function SidebarDropdown({ item }) {
  const Icon = item.icon;
  const location = useLocation();
  const hasActiveChild = item.children.some((child) => isItemActive(child, location.pathname));

  return (
    <details className="group/dropdown" open={hasActiveChild || undefined}>
      <summary
        className={[
          "flex cursor-pointer list-none items-center gap-2.5 rounded-md px-2.5 py-[5px] transition-all hover:bg-white/8 hover:text-white [&::-webkit-details-marker]:hidden",
          hasActiveChild ? "text-white" : "text-violet-100",
        ].join(" ")}
      >
        <Icon
          className="h-[15px] w-[15px] flex-shrink-0 text-[#F5EEFF]"
          strokeWidth={1.8}
        />

        <span className="flex-1 text-[11px] font-medium">{item.label}</span>

        <ChevronDown className="h-3.5 w-3.5 text-violet-100 transition-transform duration-200 group-open/dropdown:rotate-180" />
      </summary>

      <div className="mt-1 space-y-0.5 pl-6">
        {item.children.map((child) => {
          const ChildIcon = child.icon;

          return (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                {
                  const active = isActive || isItemActive(child, location.pathname);
                  return [

                  "flex items-center gap-2.5 rounded-md px-2.5 py-[5px] transition-all",
                  active  ? "bg-white/10 text-[#F4B740]"
                    : "text-violet-100/85 hover:bg-white/8 hover:text-white",

                ].join(" ");
                }
              }
            >
              {({ isActive }) => (
                (() => {
                  const active = isActive || isItemActive(child, location.pathname);
                  return (
                <>
                  <ChildIcon
                    className="h-[13px] w-[13px] flex-shrink-0"
                    style={{ color: active ? "#F4B740" : "#EDE7FF" }}
                    strokeWidth={1.8}
                  />
                  <span className="text-[10.5px] font-medium">{child.label}</span>
                </>
                  );
                })()
              )}
            </NavLink>
          );
        })}
      </div>
    </details>
  );
}

function isItemActive(item, pathname) {
  if (item.activePaths?.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return true;
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navItems = getSidebarItemsByRole(user?.roles || []);

  return (
    <aside
      style={{ width: SIDEBAR_WIDTH }}
      className="sidebar fixed left-0 top-0 z-20 flex h-screen flex-col border-r border-[#3A0B79] bg-[linear-gradient(180deg,#24005A_0%,#2D0B68_100%)] transition-colors dark:border-[#3A0B79]"
    >
      <NavLink
        to="/accueil"
        className="group flex shrink-0 items-center gap-3 border-b border-white/12 px-4 transition hover:bg-white/[0.04]"
        style={{ height: TOPBAR_HEIGHT }}
      >
        <img
          src={qonformeLogo}
          alt="Qonforme"
          className="h-5 w-5 transition duration-200 group-hover:scale-[1.05]"
        />

        <div className="min-w-0">
          <span className="block text-[13px] font-semibold tracking-[-0.03em] text-white">
            Qonform
          </span>
        </div>
      </NavLink>

      <div className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-2">
        <nav className="space-y-0.5">
          {navItems.map((item) =>
            item.children ? (
              <SidebarDropdown key={item.label} item={item} />
            ) : (
              <SidebarLink key={item.to} item={item} />
            ),
          )}
        </nav>

        <div className="mt-2 space-y-1.5">
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
