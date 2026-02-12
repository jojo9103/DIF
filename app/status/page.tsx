import RequireAuth from "@/components/auth/require-auth";
import DashboardNavbar from "@/components/dashboard/navbar";
import StatusPanel from "@/components/dashboard/status-panel";

export default function StatusPage() {
  return (
    <RequireAuth>
      <main className="min-h-screen bg-[#181818] text-white">
        <DashboardNavbar />
        <section className="relative min-h-screen px-6 pb-16 pt-28 lg:px-10">
          <div
            className="absolute inset-0 -z-10"
            style={{
              backgroundColor: "#181818",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
          <StatusPanel />
        </section>
      </main>
    </RequireAuth>
  );
}
