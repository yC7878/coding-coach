import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ACTIVE_SESSION_STORAGE_KEY,
  PROGRESS_STORAGE_KEY,
  clearActiveSession,
  clearProgress,
  completionDateFor,
  createEmptyProgress,
  finishActiveSession,
  getActiveSession,
  getProgress,
  pauseActiveSession,
  resumeActiveSession,
  setActiveSession,
  setProgress,
  startActiveSession,
  updateProblemProgress,
} from "../services/progressService";
import type { ActiveStudySession, ProblemProgress, ProgressMap, SessionResult, StudySession } from "../types/progress";

export type StartSessionResult =
  | { type: "started"; session: ActiveStudySession }
  | { type: "already_active"; session: ActiveStudySession }
  | { type: "conflict"; session: ActiveStudySession };

interface ProgressContextValue {
  progress: ProgressMap;
  activeSession: ActiveStudySession | null;
  markCompleted: (problemId: string) => void;
  markIncomplete: (problemId: string) => void;
  updateConfidence: (problemId: string, confidence?: number) => void;
  updateProblem: (problemId: string, update: Partial<ProblemProgress>) => void;
  startSession: (problemId: string) => StartSessionResult;
  replaceActiveSession: (problemId: string) => ActiveStudySession;
  pauseSession: () => void;
  resumeSession: () => void;
  finishSession: (result: SessionResult, confidence?: number) => StudySession | null;
  replaceProgress: (nextProgress: ProgressMap) => void;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgressState] = useState<ProgressMap>(() => getProgress());
  const [activeSession, setActiveSessionState] = useState<ActiveStudySession | null>(() => getActiveSession());

  const persist = (nextProgress: ProgressMap) => {
    setProgress(nextProgress);
    setProgressState(nextProgress);
  };

  const updateActive = (nextSession: ActiveStudySession | null) => {
    if (nextSession) setActiveSession(nextSession);
    else clearActiveSession();
    setActiveSessionState(nextSession);
  };

  useEffect(() => {
    const syncStorage = (event: StorageEvent) => {
      if (event.key === PROGRESS_STORAGE_KEY) setProgressState(getProgress());
      if (event.key === ACTIVE_SESSION_STORAGE_KEY) setActiveSessionState(getActiveSession());
    };
    window.addEventListener("storage", syncStorage);
    return () => window.removeEventListener("storage", syncStorage);
  }, []);

  const value = useMemo<ProgressContextValue>(() => ({
    progress,
    activeSession,
    markCompleted: (problemId) => {
      const current = progress[problemId] ?? createEmptyProgress();
      const next = { ...current, status: "completed" as const, completedAt: completionDateFor() };
      updateProblemProgress(problemId, next);
      persist({ ...progress, [problemId]: next });
    },
    markIncomplete: (problemId) => {
      const current = progress[problemId] ?? createEmptyProgress();
      const { completedAt: _completedAt, ...rest } = current;
      const next = { ...rest, status: "not_started" as const };
      updateProblemProgress(problemId, next);
      persist({ ...progress, [problemId]: next });
    },
    updateConfidence: (problemId, confidence) => {
      const current = progress[problemId] ?? createEmptyProgress();
      const next = { ...current, ...(confidence ? { confidence } : {}) };
      if (!confidence) delete next.confidence;
      updateProblemProgress(problemId, next);
      persist({ ...progress, [problemId]: next });
    },
    updateProblem: (problemId, update) => {
      const current = progress[problemId] ?? createEmptyProgress();
      const next = { ...current, ...update, sessions: update.sessions ?? current.sessions } as ProblemProgress;
      updateProblemProgress(problemId, next);
      persist({ ...progress, [problemId]: next });
    },
    startSession: (problemId) => {
      if (activeSession) {
        return activeSession.problemId === problemId ? { type: "already_active", session: activeSession } : { type: "conflict", session: activeSession };
      }
      const session = startActiveSession(problemId);
      const current = progress[problemId] ?? createEmptyProgress();
      persist({ ...progress, [problemId]: { ...current, status: "in_progress" } });
      setActiveSessionState(session);
      return { type: "started", session };
    },
    replaceActiveSession: (problemId) => {
      let nextProgress = { ...progress };
      if (activeSession) {
        const partialSession = finishActiveSession();
        const prior = progress[activeSession.problemId] ?? createEmptyProgress();
        if (partialSession) {
          nextProgress[activeSession.problemId] = {
            ...prior,
            status: prior.status === "completed" ? "completed" : "not_started",
            sessions: [...prior.sessions, partialSession],
          };
        }
      }
      const session = startActiveSession(problemId);
      const current = nextProgress[problemId] ?? createEmptyProgress();
      nextProgress = { ...nextProgress, [problemId]: { ...current, status: "in_progress" } };
      persist(nextProgress);
      setActiveSessionState(session);
      return session;
    },
    pauseSession: () => {
      const paused = pauseActiveSession();
      if (paused) setActiveSessionState(paused);
    },
    resumeSession: () => {
      const resumed = resumeActiveSession();
      if (resumed) setActiveSessionState(resumed);
    },
    finishSession: (result, confidence) => {
      const finished = finishActiveSession(new Date(), result, confidence);
      if (!finished) return null;
      const problemId = activeSession?.problemId;
      if (!problemId) return finished;
      const current = progress[problemId] ?? createEmptyProgress();
      const next: ProblemProgress = {
        ...current,
        status: "completed",
        completedAt: completionDateFor(),
        sessions: [...current.sessions, finished],
        ...(confidence ? { confidence } : {}),
      };
      persist({ ...progress, [problemId]: next });
      setActiveSessionState(null);
      return finished;
    },
    replaceProgress: (nextProgress) => {
      persist(nextProgress);
      updateActive(null);
    },
    resetProgress: () => {
      clearProgress();
      clearActiveSession();
      setProgressState({});
      setActiveSessionState(null);
    },
  }), [activeSession, progress]);

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("useProgress must be used inside ProgressProvider");
  return context;
}
