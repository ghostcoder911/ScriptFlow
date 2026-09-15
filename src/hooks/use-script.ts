"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadProject, saveProject } from "@/lib/storage";
import type { ScriptProject } from "@/lib/types";

export function useScript(id: string) {
  const [script, setScript] = useState<ScriptProject | null>(null);
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const existing = loadProject(id);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage
    setScript(existing);
    setReady(true);
  }, [id]);

  const persist = useCallback((next: ScriptProject) => {
    const saved = saveProject(next);
    setScript(saved);
    setDirty(false);
  }, []);

  const update = useCallback((patch: (prev: ScriptProject) => ScriptProject) => {
    setScript((prev) => {
      if (!prev) return prev;
      const next = patch(prev);
      setDirty(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => persist(next), 450);
      return next;
    });
  }, [persist]);

  const saveNow = useCallback(() => {
    if (!script) return;
    if (timer.current) window.clearTimeout(timer.current);
    persist(script);
  }, [persist, script]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  return { script, ready, dirty, update, saveNow, missing: ready && !script };
}

