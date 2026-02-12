import path from "path";
import { promises as fs } from "fs";
import { cookies } from "next/headers";
import { sessionCookieName, verifySession } from "@/lib/auth";
import DashboardNavbar from "@/components/dashboard/navbar";
import RequireAuth from "@/components/auth/require-auth";
import DashboardContent from "@/components/dashboard/dashboard-content";
import { loadProjects } from "@/lib/results";

const loadViewData = async (userId: string, preferredProject?: string) => {
  const resultsUserRoot = path.join(process.cwd(), "data", "results", userId);
  await fs.access(resultsUserRoot);
  return loadProjects({
    viewRoot: resultsUserRoot,
    preferredProject,
    basePathForSample: (project, sample) => `/results/${userId}/${project}/${sample}`,
  });
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { project?: string };
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  const user = verifySession(token);
  const userId = user?.id ? user.id : "guest";

  const preferredProject =
    typeof searchParams?.project === "string" ? searchParams.project : undefined;
  const { sampleName, samples, projectName, projects } = await loadViewData(
    userId,
    preferredProject
  );
  const hasResults = samples.length > 0;

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

          <DashboardContent
            projectName={projectName}
            samples={samples}
            projects={projects}
            initialSample={sampleName}
            hasResults={hasResults}
          />
        </section>
      </main>
    </RequireAuth>
  );
}
