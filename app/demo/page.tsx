import path from "path";
import { promises as fs } from "fs";
import DashboardNavbar from "@/components/dashboard/navbar";
import RequireAuth from "@/components/auth/require-auth";
import DashboardViewer from "@/components/dashboard/dashboard-viewer";

type HeatmapRow = Record<string, string>;

const parseCsv = (raw: string) => {
  const [headerLine, ...rows] = raw.split(/\r?\n/).filter(Boolean);
  if (!headerLine) return [];
  const headers = headerLine.split(",").map((h) => h.trim());
  return rows.map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return headers.reduce<HeatmapRow>((acc, key, index) => {
      acc[key] = values[index] ?? "";
      return acc;
    }, {});
  });
};

const DEMO_PROJECTS = ["demo", "Test"];

const loadDemoData = async () => {
  const resultsRoot = path.join(process.cwd(), "data", "results");
  let projectName = "";
  let projects: {
    name: string;
    samples: {
      name: string;
      images: { src: string; label: string }[];
      stats: {
        linearTarget?: string;
        linearProbability?: string;
        linearCorrect?: string;
        periTarget?: string;
        periProbability?: string;
        periCorrect?: string;
      };
    }[];
  }[] = [];
  let sampleName = "";
  let samples: {
    name: string;
    images: { src: string; label: string }[];
    stats: {
      linearTarget?: string;
      linearProbability?: string;
      linearCorrect?: string;
      periTarget?: string;
      periProbability?: string;
      periCorrect?: string;
    };
  }[] = [];

  try {
    const entries = await fs.readdir(resultsRoot, { withFileTypes: true });
    const projectDirs = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => DEMO_PROJECTS.includes(name));

    const projectDir = projectDirs[0];
    if (!projectDir) {
      return { sampleName, samples, projectName, projects };
    }

    projectName = projectDir;
    projects = await Promise.all(
      projectDirs.map(async (dirName) => {
        const projectRoot = path.join(resultsRoot, dirName);
        let rows: HeatmapRow[] = [];
        try {
          const raw = await fs.readFile(path.join(projectRoot, "heatmap_summary.csv"), "utf8");
          rows = parseCsv(raw);
        } catch {
          rows = [];
        }
        const projectEntries = await fs.readdir(projectRoot, { withFileTypes: true });
        const sampleDirs = projectEntries
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name);

        const projectSamples = sampleDirs.map((sampleDir) => {
          const basePath = `/results/${dirName}/${sampleDir}`;
          const sampleImages = [
            { src: `${basePath}/original.png`, label: "Original" },
            { src: `${basePath}/overlay_Linear Pattern.png`, label: "Linear Pattern" },
            { src: `${basePath}/overlay_Peri-vascular Pattern.png`, label: "Peri-vascular Pattern" },
          ].map((img) => ({ ...img, src: encodeURI(img.src) }));

          const matched = rows.find((row) => row.Image_name === sampleDir);
          const sampleStats = matched
            ? {
                linearTarget: matched["Linear Pattern_target"],
                linearProbability: matched["Linear Pattern_probability"],
                linearCorrect: matched["Linear Pattern_correct"],
                periTarget: matched["Peri-vascular Pattern_target"],
                periProbability: matched["Peri-vascular Pattern_probability"],
                periCorrect: matched["Peri-vascular Pattern_correct"],
              }
            : {};
          return { name: sampleDir, images: sampleImages, stats: sampleStats };
        });

        return { name: dirName, samples: projectSamples };
      })
    );

    const activeProject = projects.find((p) => p.name === projectName) ?? projects[0];
    if (activeProject) {
      samples = activeProject.samples;
      const sampleDir = samples[0]?.name;
      if (sampleDir) {
        sampleName = sampleDir;
      }
    }
  } catch {
    // no-op: allow empty state
  }

  return { sampleName, samples, projectName, projects };
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
          />
        </section>
      </main>
    </RequireAuth>
  );
}
