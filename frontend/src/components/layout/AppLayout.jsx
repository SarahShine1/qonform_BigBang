import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppLayout({ pageTitle, userName, userRole, children }) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb" }}>
      {/* Fixed left sidebar */}
      <Sidebar />

      {/* Fixed top header — starts after sidebar */}
      <Topbar pageTitle={pageTitle} userName={userName} userRole={userRole} />

      {/* Scrollable main content — offset 192px left, 56px top */}
      <main style={{ marginLeft: 192, paddingTop: 56, minHeight: "100vh" }}>
        <div style={{ padding: 24 }}>{children}</div>
      </main>
    </div>
  );
}