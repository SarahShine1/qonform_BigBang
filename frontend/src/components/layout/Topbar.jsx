import { Bell, Menu, MessageSquare, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { messagingApi } from "../../api/messages.api";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from "./layout.constants";
import MessagingPanel from "./MessagingPanel";

export default function Topbar({ pageTitle, userName, userRole }) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const messagingRef = useRef(null);
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const initials = userName
    ? userName
        .split(" ")
        .map((word) => word[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id_user) return;

    try {
      const conversations = await messagingApi.getConversations();
      const totalUnread = conversations.reduce(
        (count, conversation) => count + (conversation.unread_count || 0),
        0
      );
      setUnreadCount(totalUnread);
    } catch {
      setUnreadCount(0);
    }
  }, [user?.id_user]);

  useEffect(() => {
    if (!user?.id_user) return undefined;

    let cancelled = false;

    async function loadUnreadCount() {
      try {
        const conversations = await messagingApi.getConversations();
        if (cancelled) return;

        const totalUnread = conversations.reduce(
          (count, conversation) => count + (conversation.unread_count || 0),
          0
        );
        setUnreadCount(totalUnread);
      } catch {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    }

    loadUnreadCount();

    return () => {
      cancelled = true;
    };
  }, [user?.id_user]);

  useEffect(() => {
    if (!messagingOpen) return undefined;

    function handleClickOutside(event) {
      if (!messagingRef.current?.contains(event.target)) {
        setMessagingOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMessagingOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [messagingOpen]);

  return (
    <header
      className="fixed top-0 right-0 z-10 flex items-center justify-between border-b border-[#EEE7FA] bg-white px-5 transition-colors dark:border-slate-800 dark:bg-slate-900 xl:px-6"
      style={{ left: SIDEBAR_WIDTH, height: TOPBAR_HEIGHT }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Menu className="h-[18px] w-[18px]" />
        </button>
        <span className="text-[14px] font-semibold text-slate-900 dark:text-slate-100">{pageTitle}</span>
      </div>

      <div className="flex items-center gap-3">
        <div ref={messagingRef} className="relative">
          <button
            type="button"
            onClick={() => setMessagingOpen((current) => !current)}
            className="relative inline-flex h-[34px] w-[34px] items-center justify-center rounded-md border border-[#E9E1F8] text-[#3B0A7A] transition hover:bg-[#F8F2FF] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            title="Ouvrir la messagerie"
          >
            <MessageSquare className="h-4 w-4" />
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#58148E] px-1 text-[8px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>

          {messagingOpen ? (
            <MessagingPanel
              open={messagingOpen}
              onClose={() => setMessagingOpen(false)}
              onInboxChange={refreshUnreadCount}
            />
          ) : null}
        </div>

        <button
          type="button"
          className="relative inline-flex h-[34px] w-[34px] items-center justify-center rounded-md border border-[#E9E1F8] text-[#3B0A7A] transition hover:bg-[#F8F2FF] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -right-1 -top-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#58148E] px-1 text-[8px] font-semibold text-white">
            3
          </span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
          className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="text-right">
          <p className="text-[12.5px] font-semibold leading-[1.2] text-slate-900 dark:text-slate-100">
            {userName}
          </p>
          <p className="text-[10px] leading-[1.2] text-slate-400 dark:text-slate-500">{userRole}</p>
        </div>

        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#58148E]">
          <span className="text-[12px] font-semibold text-white">{initials}</span>
        </div>
      </div>
    </header>
  );
}
