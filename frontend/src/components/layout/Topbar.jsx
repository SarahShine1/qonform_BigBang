export default function Topbar({ pageTitle, userName, userRole }) {
  // Generate initials from name
  const initials = userName
    ? userName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <header
      className="fixed top-0 right-0 bg-white border-b border-gray-100 flex items-center justify-between z-10 px-6"
      style={{ left: 192, height: 56 }}
    >
      {/* Page breadcrumb title */}
      <span style={{ fontSize: 13, color: "#6b7280" }}>{pageTitle}</span>

      {/* User info + avatar */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", lineHeight: 1.3 }}>
            {userName}
          </p>
          <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.3 }}>{userRole}</p>
        </div>
        <div
          className="rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0"
          style={{ width: 32, height: 32 }}
        >
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{initials}</span>
        </div>
      </div>
    </header>
  );
}