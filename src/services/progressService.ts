import type {
  ActiveStudySession,
  ProblemProgress,
  ProblemStatus,
  ProgressExport,
  ProgressMap,
  SessionResult,
  StudySession,
  SyntaxMistake,
} from "../types/progress";
import type { GithubSyncCache } from "../types/github";
import type { AlgorithmUnderstanding, AnalysisValue, DataSource, PerformanceDetails } from "../types/performance";

export const PROGRESS_STORAGE_KEY = "neetcode-coach-progress";
export const ACTIVE_SESSION_STORAGE_KEY = "neetcode-coach-active-session";

const statuses: ProblemStatus[] = ["not_started", "in_progress", "completed"];
const results: SessionResult[] = ["independent", "syntax_recall", "syntax_help", "algorithm_hint", "significant_help", "solution"];
const legacyResults: Record<string, SessionResult> = {
  independent: "independent",
  needed_hint: "algorithm_hint",
  needed_significant_help: "significant_help",
  looked_at_solution: "solution",
};
const dataSources: DataSource[] = ["user", "github", "analysis", "user_override"];
const algorithmUnderstandings: AlgorithmUnderstanding[] = ["strong", "developing", "needs_support"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isTimestamp = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

const isConfidence = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;

const isNonNegativeNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

export const createEmptyProgress = (): ProblemProgress => ({ status: "not_started", sessions: [] });

export const isSyntaxMistake = (value: unknown): value is SyntaxMistake =>
  isRecord(value) && typeof value.syntaxId === "string" && Boolean(value.syntaxId) && typeof value.entered === "string" && Boolean(value.entered.trim()) && typeof value.expected === "string" && Boolean(value.expected.trim());

function normalizeAnalysisValue<T>(value: unknown, isValue: (candidate: unknown) => candidate is T): AnalysisValue<T> | null {
  if (!isRecord(value) || !isValue(value.value) || !dataSources.includes(value.source as DataSource)) return null;
  if (value.confidence !== undefined && (typeof value.confidence !== "number" || value.confidence < 0 || value.confidence > 1)) return null;
  return { value: value.value, source: value.source as DataSource, ...(typeof value.confidence === "number" ? { confidence: value.confidence } : {}) };
}

function normalizePerformanceDetails(value: unknown): PerformanceDetails | null {
  if (!isRecord(value)) return null;
  const solveTime = value.solveTimeSeconds === undefined ? undefined : normalizeAnalysisValue(value.solveTimeSeconds, isNonNegativeNumber);
  const result = value.result === undefined ? undefined : normalizeAnalysisValue(value.result, (item): item is SessionResult => typeof item === "string" && results.includes(item as SessionResult));
  const confidence = value.confidence === undefined ? undefined : normalizeAnalysisValue(value.confidence, isConfidence);
  const algorithm = value.algorithmUnderstanding === undefined ? undefined : normalizeAnalysisValue(value.algorithmUnderstanding, (item): item is AlgorithmUnderstanding => algorithmUnderstandings.includes(item as AlgorithmUnderstanding));
  const pattern = value.pattern === undefined ? undefined : normalizeAnalysisValue(value.pattern, (item): item is string => typeof item === "string" && Boolean(item.trim()));
  const syntaxIssues = value.syntaxIssues === undefined ? undefined : normalizeAnalysisValue(value.syntaxIssues, (item): item is SyntaxMistake[] => Array.isArray(item) && item.every(isSyntaxMistake));
  const notes = value.notes === undefined ? undefined : normalizeAnalysisValue(value.notes, (item): item is string => typeof item === "string");
  if ((value.solveTimeSeconds !== undefined && !solveTime) || (value.result !== undefined && !result) || (value.confidence !== undefined && !confidence) || (value.algorithmUnderstanding !== undefined && !algorithm) || (value.pattern !== undefined && !pattern) || (value.syntaxIssues !== undefined && !syntaxIssues) || (value.notes !== undefined && !notes)) return null;
  return {
    ...(solveTime ? { solveTimeSeconds: solveTime } : {}),
    ...(result ? { result } : {}),
    ...(confidence ? { confidence } : {}),
    ...(algorithm ? { algorithmUnderstanding: algorithm } : {}),
    ...(pattern ? { pattern } : {}),
    ...(syntaxIssues ? { syntaxIssues } : {}),
    ...(notes ? { notes } : {}),
  };
}

const normalizeSessionResult = (value: unknown): SessionResult | undefined | null => {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  return results.includes(value as SessionResult) ? value as SessionResult : legacyResults[value] ?? null;
};

export const normalizeStudySession = (value: unknown): StudySession | null => {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id || !isTimestamp(value.startedAt) || !isTimestamp(value.endedAt) || !isNonNegativeNumber(value.durationSeconds)) return null;
  const result = normalizeSessionResult(value.result);
  if (result === null || (value.confidence !== undefined && !isConfidence(value.confidence)) || (value.pausedDurationSeconds !== undefined && !isNonNegativeNumber(value.pausedDurationSeconds)) || (value.syntaxMistakes !== undefined && (!Array.isArray(value.syntaxMistakes) || !value.syntaxMistakes.every(isSyntaxMistake))) || (value.notes !== undefined && typeof value.notes !== "string")) return null;
  return {
    id: value.id,
    startedAt: value.startedAt,
    endedAt: value.endedAt,
    durationSeconds: value.durationSeconds,
    ...(result ? { result } : {}),
    ...(isConfidence(value.confidence) ? { confidence: value.confidence } : {}),
    ...(Array.isArray(value.syntaxMistakes) && value.syntaxMistakes.length ? { syntaxMistakes: value.syntaxMistakes as SyntaxMistake[] } : {}),
    ...(typeof value.notes === "string" && value.notes.trim() ? { notes: value.notes.trim() } : {}),
    ...(isNonNegativeNumber(value.pausedDurationSeconds) ? { pausedDurationSeconds: value.pausedDurationSeconds } : {}),
  };
};

export const isStudySession = (value: unknown): value is StudySession => normalizeStudySession(value) !== null;

/** Accepts version 1 records by supplying the new append-only session array. */
export const normalizeProblemProgress = (value: unknown): ProblemProgress | null => {
  if (!isRecord(value) || !statuses.includes(value.status as ProblemStatus)) return null;
  if (value.completedAt !== undefined && typeof value.completedAt !== "string") return null;
  if (value.confidence !== undefined && !isConfidence(value.confidence)) return null;
  if (value.sessions !== undefined && !Array.isArray(value.sessions)) return null;
  const sessions = (value.sessions ?? []).map(normalizeStudySession);
  if (sessions.some((session) => session === null)) return null;
  const performance = value.performance === undefined ? undefined : normalizePerformanceDetails(value.performance);
  if (value.performance !== undefined && !performance) return null;

  const progress: ProblemProgress = { status: value.status as ProblemStatus, sessions: sessions as StudySession[] };
  if (typeof value.completedAt === "string") progress.completedAt = value.completedAt;
  if (isConfidence(value.confidence)) progress.confidence = value.confidence;
  if (performance) progress.performance = performance;
  return progress;
};

export const isProblemProgress = (value: unknown): value is ProblemProgress => normalizeProblemProgress(value) !== null;

export const normalizeProgressMap = (value: unknown): ProgressMap | null => {
  if (!isRecord(value)) return null;
  const normalized: ProgressMap = {};
  for (const [id, item] of Object.entries(value)) {
    const progress = normalizeProblemProgress(item);
    if (!progress) return null;
    normalized[id] = progress;
  }
  return normalized;
};

export const isProgressMap = (value: unknown): value is ProgressMap => normalizeProgressMap(value) !== null;

export const isActiveStudySession = (value: unknown): value is ActiveStudySession => {
  if (!isRecord(value) || typeof value.id !== "string" || !value.id || typeof value.problemId !== "string" || !value.problemId || !isTimestamp(value.startedAt) || !isNonNegativeNumber(value.accumulatedActiveSeconds) || !isNonNegativeNumber(value.pausedDurationSeconds) || typeof value.isPaused !== "boolean") return false;
  if (value.activeSegmentStartedAt !== undefined && !isTimestamp(value.activeSegmentStartedAt)) return false;
  if (value.pausedAt !== undefined && !isTimestamp(value.pausedAt)) return false;
  return value.isPaused ? Boolean(value.pausedAt) : Boolean(value.activeSegmentStartedAt);
};

const timestamp = (now = new Date()) => now.toISOString();
const today = (now = new Date()) => now.toISOString().slice(0, 10);
const elapsedSeconds = (from: string, now: Date) => Math.max(0, Math.floor((now.getTime() - Date.parse(from)) / 1000));
const createId = () => globalThis.crypto?.randomUUID?.() ?? `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

function readStoredProgress(value: unknown): ProgressMap | null {
  if (isRecord(value) && (value.version === 1 || value.version === 2 || value.version === 3 || value.version === 4) && "progress" in value) return normalizeProgressMap(value.progress);
  return normalizeProgressMap(value); // legacy localStorage stored the map directly
}

export function getProgress(): ProgressMap {
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    return readStoredProgress(JSON.parse(raw)) ?? {};
  } catch {
    return {};
  }
}

export function getProblemProgress(problemId: string): ProblemProgress | undefined {
  return getProgress()[problemId];
}

export function setProgress(progress: ProgressMap): void {
  const normalized = normalizeProgressMap(progress);
  if (!normalized) return;
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ version: 4, progress: normalized }));
  } catch {
    // Browser storage can be unavailable; React state still supports this visit.
  }
}

export function updateProblemProgress(problemId: string, problemProgress: ProblemProgress): void {
  if (!problemId || !isProblemProgress(problemProgress)) return;
  setProgress({ ...getProgress(), [problemId]: normalizeProblemProgress(problemProgress)! });
}

/** Retained for a safe programmatic migration path; session work should use finishActiveSession. */
export function toggleProblemCompleted(problemId: string): void {
  const current = getProblemProgress(problemId) ?? createEmptyProgress();
  if (current.status === "completed") {
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

export function createProgressExport(progress: ProgressMap, githubCache?: GithubSyncCache): ProgressExport {
  return { version: 4, exportedAt: new Date().toISOString(), progress: normalizeProgressMap(progress) ?? {}, ...(githubCache ? { githubCache } : {}) };
}

/** Accepts the original Phase 1 export plus v2 sessions, v3 syntax, and v4 performance exports. */
export function parseProgressImport(value: unknown): ProgressMap | null {
  if (!isRecord(value) || (value.version !== 1 && value.version !== 2 && value.version !== 3 && value.version !== 4) || !isTimestamp(value.exportedAt)) return null;
  return normalizeProgressMap(value.progress);
}

export function getActiveSession(): ActiveStudySession | null {
  try {
    const raw = window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isActiveStudySession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function setActiveSession(session: ActiveStudySession): void {
  if (!isActiveStudySession(session)) return;
  try {
    window.localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Current in-memory state remains usable if persistent storage is unavailable.
  }
}

export function clearActiveSession(): void {
  try {
    window.localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
  } catch {
    // No action is needed when browser storage is unavailable.
  }
}

export function startActiveSession(problemId: string, now = new Date()): ActiveStudySession {
  const startedAt = timestamp(now);
  const session: ActiveStudySession = {
    id: createId(),
    problemId,
    startedAt,
    activeSegmentStartedAt: startedAt,
    accumulatedActiveSeconds: 0,
    pausedDurationSeconds: 0,
    isPaused: false,
  };
  setActiveSession(session);
  return session;
}

/** Uses timestamps, not interval ticks, so elapsed time survives re-renders and refreshes. */
export function getActiveSessionDuration(session: ActiveStudySession, now = new Date()): number {
  if (session.isPaused || !session.activeSegmentStartedAt) return session.accumulatedActiveSeconds;
  return session.accumulatedActiveSeconds + elapsedSeconds(session.activeSegmentStartedAt, now);
}

export function pauseActiveSession(now = new Date()): ActiveStudySession | null {
  const current = getActiveSession();
  if (!current || current.isPaused) return current;
  const paused: ActiveStudySession = {
    ...current,
    accumulatedActiveSeconds: getActiveSessionDuration(current, now),
    activeSegmentStartedAt: undefined,
    isPaused: true,
    pausedAt: timestamp(now),
  };
  setActiveSession(paused);
  return paused;
}

export function resumeActiveSession(now = new Date()): ActiveStudySession | null {
  const current = getActiveSession();
  if (!current || !current.isPaused || !current.pausedAt) return current;
  const resumed: ActiveStudySession = {
    ...current,
    activeSegmentStartedAt: timestamp(now),
    pausedDurationSeconds: current.pausedDurationSeconds + elapsedSeconds(current.pausedAt, now),
    isPaused: false,
    pausedAt: undefined,
  };
  setActiveSession(resumed);
  return resumed;
}

export function createStudySessionFromActive(
  active: ActiveStudySession,
  now = new Date(),
  result?: SessionResult,
  confidence?: number,
  syntaxMistakes?: SyntaxMistake[],
  notes?: string,
): StudySession {
  const pausedDurationSeconds = active.pausedDurationSeconds + (active.isPaused && active.pausedAt ? elapsedSeconds(active.pausedAt, now) : 0);
  return {
    id: active.id,
    startedAt: active.startedAt,
    endedAt: timestamp(now),
    durationSeconds: getActiveSessionDuration(active, now),
    ...(result ? { result } : {}),
    ...(confidence ? { confidence } : {}),
    ...(syntaxMistakes?.length ? { syntaxMistakes } : {}),
    ...(notes?.trim() ? { notes: notes.trim() } : {}),
    ...(pausedDurationSeconds > 0 ? { pausedDurationSeconds } : {}),
  };
}

/** Ends and clears the active timer; callers append the returned immutable session to progress history. */
export function finishActiveSession(now = new Date(), result?: SessionResult, confidence?: number, syntaxMistakes?: SyntaxMistake[], notes?: string): StudySession | null {
  const active = getActiveSession();
  if (!active) return null;
  const session = createStudySessionFromActive(active, now, result, confidence, syntaxMistakes, notes);
  clearActiveSession();
  return session;
}

export const completionDateFor = (now = new Date()) => today(now);
