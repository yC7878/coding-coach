import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  clearProgress,
  getProgress,
  setProgress,
  toggleProblemCompleted,
  updateProblemProgress,
} from "../services/progressService";
import type { ProblemProgress, ProgressMap } from "../types/progress";

interface ProgressContextValue {
  progress: ProgressMap;
  markCompleted: (problemId: string) => void;
  markIncomplete: (problemId: string) => void;
  toggleCompleted: (problemId: string) => void;
  updateConfidence: (problemId: string, confidence?: number) => void;
  updateProblem: (problemId: string, update: Partial<ProblemProgress>) => void;
  replaceProgress: (nextProgress: ProgressMap) => void;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgressState] = useState<ProgressMap>(() => getProgress());

  const persist = (nextProgress: ProgressMap) => {
    setProgress(nextProgress);
    setProgressState(nextProgress);
  };

  useEffect(() => {
    const syncProgress = (event: StorageEvent) => {
      if (event.key === "neetcode-coach-progress") setProgressState(getProgress());
    };
    window.addEventListener("storage", syncProgress);
    return () => window.removeEventListener("storage", syncProgress);
  }, []);

  const value = useMemo<ProgressContextValue>(() => ({
    progress,
    markCompleted: (problemId) => {
      const current = progress[problemId];
      const next = { ...current, status: "completed" as const, completedAt: new Date().toISOString().slice(0, 10) };
      updateProblemProgress(problemId, next);
      persist({ ...progress, [problemId]: next });
    },
    markIncomplete: (problemId) => {
      const { completedAt: _completedAt, ...rest } = progress[problemId] ?? { status: "not_started" as const };
      const next = { ...rest, status: "not_started" as const };
      updateProblemProgress(problemId, next);
      persist({ ...progress, [problemId]: next });
    },
    toggleCompleted: (problemId) => {
      toggleProblemCompleted(problemId);
      setProgressState(getProgress());
    },
    updateConfidence: (problemId, confidence) => {
      const current = progress[problemId] ?? { status: "not_started" as const };
      const next = { ...current, ...(confidence ? { confidence } : {}) };
      if (!confidence) delete next.confidence;
      updateProblemProgress(problemId, next);
      persist({ ...progress, [problemId]: next });
    },
    updateProblem: (problemId, update) => {
      const current = progress[problemId] ?? { status: "not_started" as const };
      const next = { ...current, ...update } as ProblemProgress;
      updateProblemProgress(problemId, next);
      persist({ ...progress, [problemId]: next });
    },
    replaceProgress: persist,
    resetProgress: () => {
      clearProgress();
      setProgressState({});
    },
  }), [progress]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress must be used inside ProgressProvider");
  return context;
}
