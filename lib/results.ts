import path from "path";
import { promises as fs } from "fs";

export type HeatmapRow = Record<string, string>;

export type ResultSampleStats = {
  linearTarget?: string;
  linearProbability?: string;
  linearPrediction?: string;
  linearCorrect?: string;
  periTarget?: string;
  periProbability?: string;
  periPrediction?: string;
  periCorrect?: string;
};

export type ResultSample = {
  name: string;
  images: { src: string; label: string }[];
  stats: ResultSampleStats;
};

export type ResultProject = {
  name: string;
  samples: ResultSample[];
};

export const parseCsv = (raw: string) => {
  const [headerLine, ...rows] = raw.split(/\r?\n/).filter(Boolean);
  if (!headerLine) return [] as HeatmapRow[];
  const headers = headerLine.split(",").map((h) => h.trim());
  return rows.map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return headers.reduce<HeatmapRow>((acc, key, index) => {
      acc[key] = values[index] ?? "";
      return acc;
    }, {});
  });
};

export async function loadProjects(options: {
  viewRoot: string;
  basePathForSample: (project: string, sample: string) => string;
  preferredProject?: string;
  allowedProjects?: string[];
}) {
  const { viewRoot, basePathForSample, preferredProject, allowedProjects } = options;
  let projectName = "";
  let projects: ResultProject[] = [];
  let sampleName = "";
  let samples: ResultSample[] = [];

  const entries = await fs.readdir(viewRoot, { withFileTypes: true });
  let projectDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  if (allowedProjects && allowedProjects.length > 0) {
    const allowSet = new Set(allowedProjects);
    projectDirs = projectDirs.filter((name) => allowSet.has(name));
  }
  const projectDir =
    preferredProject && projectDirs.includes(preferredProject)
      ? preferredProject
      : projectDirs[0];
  if (!projectDir) {
    return { sampleName, samples, projectName, projects };
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
        const basePath = basePathForSample(dirName, sampleDir);
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

  return { sampleName, samples, projectName, projects };
}
