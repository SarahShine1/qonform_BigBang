import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { SIDEBAR_WIDTH, TOPBAR_HEIGHT } from "./layout.constants";

export default function AppLayout({
  pageTitle,
  userName,
  userRole,
  children,
  contentClassName = "",
}) {
  return (
    <div
      className="app-layout h-screen overflow-hidden bg-[#F8F7FC] transition-colors dark:bg-slate-950"
      style={{ "--navbar-height": `${TOPBAR_HEIGHT}px` }}
    >
      <Sidebar />
      <Topbar pageTitle={pageTitle} userName={userName} userRole={userRole} />

      <main
        className="overflow-hidden"
        style={{ marginLeft: SIDEBAR_WIDTH, paddingTop: TOPBAR_HEIGHT, height: "100vh" }}
      >
        <div
          className={[
            "page-content h-[calc(100vh-var(--navbar-height))] overflow-x-hidden overflow-y-auto px-[18px] py-[14px]",
            contentClassName,
          ].join(" ")}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
