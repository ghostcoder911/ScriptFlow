"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clapperboard, Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteProject,
  duplicateProject,
  getIndexSnapshot,
  saveProject,
  subscribeProjects,
} from "@/lib/storage";
import { createBlankProject, createSampleProject } from "@/lib/sample";

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}

export function Dashboard() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const projects = useSyncExternalStore(subscribeProjects, getIndexSnapshot, () => []);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) => p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q)
    );
  }, [projects, query]);

  function refresh() {
    window.dispatchEvent(new Event("scriptflow-change"));
  }

  function openNew() {
    const project = createBlankProject();
    saveProject(project);
    router.push(`/script/${project.id}`);
  }

  function openSample() {
    const project = createSampleProject();
    saveProject(project);
    router.push(`/script/${project.id}`);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Clapperboard className="size-5" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold tracking-tight">
                Script<span className="text-primary">Flow</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Malayalam + English screenplay studio
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openSample}>
              Open sample
            </Button>
            <Button onClick={openNew}>
              <Plus />
              New screenplay
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl tracking-tight">Library</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Write in Manglish and get accurate Malayalam, dictate in either language, and pin
              scene cards before the camera rolls.
            </p>
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles…"
            className="sm:max-w-xs"
          />
        </div>

        {visible.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">No screenplays match that search.</p>
            <Button className="mt-4" onClick={openNew}>
              Start a blank script
            </Button>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((project) => (
              <li key={project.id}>
                <article className="group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition hover:border-primary/40">
                  <Link href={`/script/${project.id}`} className="flex-1">
                    <p className="text-[11px] tracking-[0.18em] text-primary uppercase">
                      Screenplay
                    </p>
                    <h2 className="mt-2 font-heading text-xl leading-snug">
                      {project.title || "Untitled"}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {project.author || "No writer credited"}
                    </p>
                    <p className="mt-4 text-xs text-muted-foreground">
                      {project.sceneCount} scenes · ~{project.pageEstimate} pages
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(project.updatedAt)}
                    </p>
                  </Link>
                  <div className="mt-4 flex gap-1 border-t pt-3">
                    <Button size="sm" variant="ghost" nativeButton={false} render={<Link href={`/script/${project.id}`} />}>
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const copy = duplicateProject(project.id);
                        if (copy) {
                          refresh();
                          router.push(`/script/${copy.id}`);
                        }
                      }}
                    >
                      <Copy />
                      Duplicate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto text-destructive"
                      onClick={() => {
                        if (pendingDelete !== project.id) {
                          setPendingDelete(project.id);
                          window.setTimeout(
                            () => setPendingDelete((id) => (id === project.id ? null : id)),
                            2500
                          );
                          return;
                        }
                        deleteProject(project.id);
                        setPendingDelete(null);
                        refresh();
                      }}
                    >
                      <Trash2 />
                      {pendingDelete === project.id ? "Sure?" : "Delete"}
                    </Button>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
