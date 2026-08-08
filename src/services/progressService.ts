import type { ProblemProgress, ProblemStatus, ProgressExport, ProgressMap } from "../types/progress";

export const PROGRESS_STORAGE_KEY = "neetcode-coach-progress";

const statuses: ProblemStatus[] = ["not_started", "in_progress", "completed"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isProblemProgress = (value: unknown): value is ProblemProgress => {
  if (!isRecord(value) || !statuses.includes(value.status as ProblemStatus)) return false;
  if (value.completedAt !== undefined && typeof value.completedAt !== "string") return false;
  if (value.confidence !== undefined && (typeof value.confidence !== "number" || !Number.isInteger(value.confidence) || value.confidence < 1 || value.confidence > 5)) return false;
  return true;
};

export const isProgressMap = (value: unknown): value is ProgressMap =>
  isRecord(value) && Object.values(value).every(isProblemProgress);

const today = () => new Date().toISOString().slice(0, 10);

export function getProgress(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return isProgressMap(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function getProblemProgress(problemId: string): ProblemProgress | undefined {
  return getProgress()[problemId];
}

export function setProgress(progress: ProgressMap): void {
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage can be unavailable (for example, private browsing). The UI still
    // works for the current session through React state.
  }
}

export function updateProblemProgress(problemId: string, problemProgress: ProblemProgress): void {
  if (!problemId || !isProblemProgress(problemProgress)) return;
  setProgress({ ...getProgress(), [problemId]: problemProgress });
}

export function toggleProblemCompleted(problemId: string): void {
  const current = getProblemProgress(problemId);
  if (current?.status === "completed") {
    const { completedAt: _completedAt, ...rest } = current;
    updateProblemProgress(problemId, { ...rest, status: "not_started" });
    return;
  }
  updateProblemProgress(problemId, { ...current, status: "completed", completedAt: today() });
}

export function clearProgress(): void {
  try {
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch {
    // No action is needed when browser storage is unavailable.
  }
}

export function createProgressExport(progress: ProgressMap): ProgressExport {
  return { version: 1, exportedAt: new Date().toISOString(), progress };
}

export function parseProgressImport(value: unknown): ProgressMap | null {
  if (!isRecord(value) || value.version !== 1 || typeof value.exportedAt !== "string" || !isProgressMap(value.progress)) {
    return null;
  }
  return value.progress;
}
