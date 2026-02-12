import path from "path";
import { promises as fs } from "fs";
import DashboardNavbar from "@/components/dashboard/navbar";
import RequireAuth from "@/components/auth/require-auth";
import DashboardViewer from "@/components/dashboard/dashboard-viewer";
import { loadProjects } from "@/lib/results";

const DEMO_PROJECTS = ["demo", "Test"];

const loadDemoData = async () => {
  const resultsRoot = path.join(process.cwd(), "data", "results");
  const entries = await fs.readdir(resultsRoot, { withFileTypes: true });
  const projectDirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => DEMO_PROJECTS.includes(name));

  const first = projectDirs[0];
  if (!first) {
    return { sampleName: "", samples: [], projectName: "", projects: [] };
  }

  return loadProjects({
    viewRoot: resultsRoot,
    preferredProject: first,
    allowedProjects: DEMO_PROJECTS,
    basePathForSample: (project, sample) => `/results/${project}/${sample}`,
  });
};

export default async function DemoPage() {
  const { sampleName, samples, projectName, projects } = await loadDemoData();

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

          <DashboardViewer
            projectName={projectName}
            samples={samples}
            projects={projects}
            initialSample={sampleName}
            allowDelete={false}
          />
        </section>
      </main>
    </RequireAuth>
  );
}
