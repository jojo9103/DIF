import path from "path";
import { promises as fs } from "fs";
import { cookies } from "next/headers";
import { sessionCookieName, verifySession } from "@/lib/auth";
import DashboardNavbar from "@/components/dashboard/navbar";
import RequireAuth from "@/components/auth/require-auth";
import DashboardContent from "@/components/dashboard/dashboard-content";

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

const loadViewData = async (userId: string, preferredProject?: string) => {
  const resultsUserRoot = path.join(process.cwd(), "data", "results", userId);
  const viewRoot = resultsUserRoot;
  let projectName = "";
  let projects: {
    name: string;
    samples: {
      name: string;
      images: { src: string; label: string }[];
      stats: {
        linearTarget?: string;
        linearProbability?: string;
        linearPrediction?: string;
        linearCorrect?: string;
        periTarget?: string;
        periProbability?: string;
        periPrediction?: string;
        periCorrect?: string;
      };
    }[];
    clinical?: {
      columns: string[];
      rows: Record<string, string>[];
    };
  }[] = [];
  let sampleName = "";
  let images: { src: string; label: string }[] = [];
  let stats: {
    linearTarget?: string;
    linearProbability?: string;
    linearPrediction?: string;
    linearCorrect?: string;
    periTarget?: string;
    periProbability?: string;
    periPrediction?: string;
    periCorrect?: string;
  } = {};
  let samples: {
    name: string;
    images: { src: string; label: string }[];
    stats: {
      linearTarget?: string;
      linearProbability?: string;
      linearPrediction?: string;
      linearCorrect?: string;
      periTarget?: string;
      periProbability?: string;
      periPrediction?: string;
      periCorrect?: string;
    };
  }[] = [];

  try {
    await fs.access(resultsUserRoot);
    const entries = await fs.readdir(viewRoot, { withFileTypes: true });
    const projectDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    const projectDir = preferredProject && projectDirs.includes(preferredProject)
      ? preferredProject
      : projectDirs[0];
    if (!projectDir) {
      return { sampleName, images, stats, samples, projectName, projects };
    }

    projectName = projectDir;
    projects = await Promise.all(
      projectDirs.map(async (dirName) => {
        const projectRoot = path.join(viewRoot, dirName);
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
          const basePath = `/results/${userId}/${dirName}/${sampleDir}`;
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
                linearPrediction: matched["Linear Pattern_prediction"],
                linearCorrect: matched["Linear Pattern_correct"],
                periTarget: matched["Peri-vascular Pattern_target"],
                periProbability: matched["Peri-vascular Pattern_probability"],
                periPrediction: matched["Peri-vascular Pattern_prediction"],
                periCorrect: matched["Peri-vascular Pattern_correct"],
              }
            : {};
          return { name: sampleDir, images: sampleImages, stats: sampleStats };
        });

        let clinical: { columns: string[]; rows: Record<string, string>[] } | undefined;
        try {
          const clinicalDir = path.join(projectRoot, "clinical_data");
          const clinicalFiles = await fs.readdir(clinicalDir);
          const csvName = clinicalFiles.find((name) => name.toLowerCase().endsWith(".csv"));
          if (csvName) {
            const raw = await fs.readFile(path.join(clinicalDir, csvName), "utf8");
            const parsed = parseCsv(raw);
            const columns = raw.split(/\r?\n/)[0]?.split(",").map((c) => c.trim()) || [];
            const sampleSet = new Set(projectSamples.map((s) => s.name));
            const enriched = parsed.map((row) => {
              const imageName = row.Image_name || row.image_name || row["Image Name"] || row["image name"] || "";
              const status = imageName && sampleSet.has(imageName) ? "Ready" : "Missing";
              return { ...row, Status: status };
            });
            const finalColumns = columns.includes("Status") ? columns : [...columns, "Status"];
            clinical = { columns: finalColumns, rows: enriched };
          }
        } catch {
          clinical = undefined;
        }

        return { name: dirName, samples: projectSamples, clinical };
      })
    );

    const activeProject = projects.find((p) => p.name === projectName) ?? projects[0];
    if (activeProject) {
      samples = activeProject.samples;
      const sampleDir = samples[0]?.name;
      if (sampleDir) {
        sampleName = sampleDir;
        images = samples[0].images;
        stats = samples[0].stats;
      }
    }
  } catch {
    // no-op: allow empty state
  }

  return { sampleName, images, stats, samples, projectName, projects };
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
