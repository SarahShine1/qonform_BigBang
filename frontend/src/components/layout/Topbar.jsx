import { Bell, Menu, MessageSquare, Moon, Sun, Filter } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { messagingApi } from "../../api/messages.api";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from "./layout.constants";
import MessagingPanel from "./MessagingPanel";
import { getNotifications, markNotificationAsRead } from "../../services/notificationService";
export default function Topbar({ pageTitle, userName, userRole, leftOffset = SIDEBAR_WIDTH, onMenuClick }) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [openNotif, setOpenNotif] = useState(false);
  const [notifFilter, setNotifFilter] = useState("all");

  useEffect(() => {
    async function loadNotifications() {
      try {
        const data = await getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error(error);
      }
    }

    if (user) {
      loadNotifications();
    }
  }, [user]);

  const notificationUnreadCount = notifications.filter((n) => !n.lu).length;
  
  async function handleRead(notification) {
    if (!notification.lu) {
      await markNotificationAsRead(notification.id_notification);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id_notification === notification.id_notification ? { ...n, lu: true } : n
        )
      );
    }

    if (notification.lien) {
      window.location.href = notification.lien;
    }
  }

  async function markAllAsRead() {
    const unreadNotifications = notifications.filter((n) => !n.lu);
    for (const notif of unreadNotifications) {
      await markNotificationAsRead(notif.id_notification);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
  }

  const filteredNotifications = notifFilter === "unread" 
    ? notifications.filter((n) => !n.lu)
    : notifications;

  const getInitials = (title) => {
    return title?.split(" ")[0]?.[0]?.toUpperCase() || "N";
  };

  const isTaskNotification = (notification) =>
    String(notification.type_notification || "").startsWith("TACHE_");

  const getAvatarColor = (typeNotification) => {
    switch (typeNotification) {
      case "TACHE_MODIFIEE":
        return "bg-orange-600";
      case "TACHE_TERMINEE":
        return "bg-emerald-600";
      case "TACHE_ANNULEE":
        return "bg-red-600";
      case "TACHE_DEMARREE":
        return "bg-blue-600";
      default:
        return "bg-violet-600";
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };
  const messagingRef = useRef(null);
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
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
      setMessageUnreadCount(totalUnread);
    } catch {
      setMessageUnreadCount(0);
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
        setMessageUnreadCount(totalUnread);
      } catch {
        if (!cancelled) {
          setMessageUnreadCount(0);
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
      style={{ left: leftOffset, height: TOPBAR_HEIGHT }}
    >
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Menu className="h-[18px] w-[18px]" />
          </button>
        )}
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
            {messageUnreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#58148E] px-1 text-[8px] font-semibold text-white">
                {messageUnreadCount > 9 ? "9+" : messageUnreadCount}
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

       <div className="relative">
  <button
    type="button"
    onClick={() => setOpenNotif((prev) => !prev)}
    className="relative inline-flex h-[34px] w-[34px] items-center justify-center rounded-md border border-[#E9E1F8] text-[#3B0A7A] transition hover:bg-[#F8F2FF] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    title="Notifications"
  >
    <Bell className="h-4 w-4" />

    {notificationUnreadCount > 0 && (
      <span className="absolute -right-1 -top-1 inline-flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#58148E] px-1 text-[8px] font-semibold text-white">
        {notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}
      </span>
    )}
  </button>

  {openNotif && (
    <div className="absolute right-0 top-12 z-[9999] w-[400px] max-h-[440px] overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      {/* Header fixe */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 to-orange-50 px-5 py-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white">
            Notifications
          </h3>
          {notificationUnreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-[12px] text-[#3B0A7A] transition hover:text-[#58148E] dark:text-violet-400 dark:hover:text-violet-300"
            >
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {/* Tabs fixe */}
      <div className="border-b border-slate-200 bg-white px-5 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setNotifFilter("all")}
              className={`px-3 py-3 text-[13px] font-medium transition ${
                notifFilter === "all"
                  ? "border-b-2 border-[#3B0A7A] text-[#3B0A7A] dark:border-violet-400 dark:text-violet-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Toutes
            </button>
            <button
              type="button"
              onClick={() => setNotifFilter("unread")}
              className={`px-3 py-3 text-[13px] font-medium transition ${
                notifFilter === "unread"
                  ? "border-b-2 border-[#3B0A7A] text-[#3B0A7A] dark:border-violet-400 dark:text-violet-400"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              Non lues ({notificationUnreadCount})
            </button>
          </div>
          <button
            type="button"
            className="p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Filtrer"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Liste scrollable */}
      <div className="h-[320px] overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-[13px] text-slate-500 dark:text-slate-400">
              Aucune notification
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredNotifications.map((notification) => (
              <button
                key={notification.id_notification}
                type="button"
                onClick={() => handleRead(notification)}
                className={`relative flex w-full items-start gap-3 px-3 py-2.5 text-left transition ${
                  notification.lu
                    ? isTaskNotification(notification)
                      ? "bg-white hover:bg-red-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                      : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                    : isTaskNotification(notification)
                      ? "bg-red-50/70 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-slate-700"
                      : "bg-violet-50/70 hover:bg-violet-100/70 dark:bg-slate-800 dark:hover:bg-slate-700"
                }`}
              >
                {/* Avatar */}
                <div className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${
                  isTaskNotification(notification)
                    ? "bg-red-500 text-white"
                    : `${getAvatarColor(notification.type_notification)} text-white`
                }`}>
                  {getInitials(notification.titre)}
                </div>

                {/* Contenu */}
                <div className="min-w-0 flex-1">
                  <p className={`line-clamp-1 text-[13px] font-bold ${
                    isTaskNotification(notification)
                      ? "text-slate-900"
                      : notification.lu
                        ? "text-slate-700 dark:text-slate-300"
                        : "text-slate-900 dark:text-white"
                  }`}>
                    {notification.titre}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[12px] text-slate-600 dark:text-slate-400">
                    {notification.message}
                  </p>
                </div>

                {/* Date et indicateur */}
                <div className="flex flex-shrink-0 flex-col items-end gap-1">
                  <p className="text-[11px] text-slate-500 dark:text-slate-500">
                    {formatTime(notification.created_at)}
                  </p>
                  {!notification.lu && (
                    <div className={`h-2 w-2 rounded-full ${
                      isTaskNotification(notification)
                        ? "bg-red-500"
                        : "bg-violet-600 dark:bg-violet-400"
                    }`} />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )}
</div>

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

        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#58148E]">
          {user?.photo_profil ? (
            <img
              src={user.photo_profil}
              alt={userName || "Profil"}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-[12px] font-semibold text-white">{initials}</span>
          )}
        </div>
      </div>
    </header>
  );
}
