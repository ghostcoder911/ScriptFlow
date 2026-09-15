import type { ProjectMeta, ScriptProject } from "@/lib/types";
import { estimatePages, sceneBlocks } from "@/lib/screenplay";
import { createSampleProject } from "@/lib/sample";

const INDEX_KEY = "scriptflow.index.v1";
const PROJECT_KEY = (id: string) => `scriptflow.project.${id}`;

function readIndex(): ProjectMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    return raw ? (JSON.parse(raw) as ProjectMeta[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(index: ProjectMeta[], emit = true) {
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  indexCacheRaw = "";
  if (emit && typeof window !== "undefined") {
    window.dispatchEvent(new Event("scriptflow-change"));
  }
}

let indexCacheRaw = "";
let indexCache: ProjectMeta[] = [];

export function getIndexSnapshot(): ProjectMeta[] {
  if (typeof window === "undefined") return [];
  const seeded = listProjects();
  const raw = localStorage.getItem(INDEX_KEY) || "[]";
  if (raw === indexCacheRaw) return indexCache;
  indexCacheRaw = raw;
  indexCache = seeded;
  return indexCache;
}

export function subscribeProjects(onChange: () => void) {
  window.addEventListener("scriptflow-change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("scriptflow-change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function metaFrom(project: ScriptProject): ProjectMeta {
  return {
    id: project.id,
    title: project.titlePage.title || project.title || "Untitled",
    author: project.titlePage.author || project.author || "",
    updatedAt: project.updatedAt,
    createdAt: project.createdAt,
    sceneCount: sceneBlocks(project.blocks).length,
    pageEstimate: estimatePages(project.blocks),
  };
}

export function listProjects(): ProjectMeta[] {
  const index = readIndex();
  if (index.length) return index.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const sample = createSampleProject();
  saveProject(sample, false);
  return [metaFrom(sample)];
}

export function loadProject(id: string): ScriptProject | null {
  try {
    const raw = localStorage.getItem(PROJECT_KEY(id));
    return raw ? (JSON.parse(raw) as ScriptProject) : null;
  } catch {
    return null;
  }
}

export function saveProject(project: ScriptProject, emit = true) {
  const next = { ...project, updatedAt: new Date().toISOString() };
  localStorage.setItem(PROJECT_KEY(next.id), JSON.stringify(next));
  const index = readIndex().filter((p) => p.id !== next.id);
  index.unshift(metaFrom(next));
  writeIndex(index, emit);
  return next;
}

export function deleteProject(id: string) {
  localStorage.removeItem(PROJECT_KEY(id));
  writeIndex(readIndex().filter((p) => p.id !== id));
}

export function duplicateProject(id: string): ScriptProject | null {
  const src = loadProject(id);
  if (!src) return null;
  const copy: ScriptProject = {
    ...structuredClone(src),
    id: crypto.randomUUID(),
    title: `${src.titlePage.title || src.title} (Copy)`,
    titlePage: {
      ...src.titlePage,
      title: `${src.titlePage.title || src.title} (Copy)`,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveProject(copy);
  return copy;
}

export function exportAll(): string {
  const projects = listProjects()
    .map((m) => loadProject(m.id))
    .filter((p): p is ScriptProject => Boolean(p));
  return JSON.stringify({ version: 1, projects }, null, 2);
}
