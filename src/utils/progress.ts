import type { Problem } from "../types/problem";
import type { ProblemProgress, ProgressMap, SessionResult, StudySession } from "../types/progress";

export interface OverallProgress {
  total: number;
  completed: number;
  remaining: number;
  percentage: number;
}

export interface CategoryStats {
  category: string;
  total: number;
  completed: number;
  percentage: number;
}

export interface RecentProblem {
  problem: Problem;
  progress: ProblemProgress;
  session: StudySession | undefined;
}

export interface CompletedSession {
  problemId: string;
  session: StudySession;
}

export interface StudySessionRecord extends CompletedSession {
  problem: Problem;
}

export const isCompleted = (progress: ProblemProgress | undefined) => progress?.status === "completed";

export const getProblemStatus = (progress: ProgressMap, problemId: string) =>
  progress[problemId]?.status ?? "not_started";

export function getCompletedProblems(problems: Problem[], progress: ProgressMap): Problem[] {
  return problems.filter((problem) => isCompleted(progress[problem.id]));
}

export function getIncompleteProblems(problems: Problem[], progress: ProgressMap): Problem[] {
  return problems.filter((problem) => !isCompleted(progress[problem.id]));
}

export function getOverallProgress(problems: Problem[], progress: ProgressMap): OverallProgress {
  const total = problems.length;
  const completed = getCompletedProblems(problems, progress).length;
  return {
    total,
    completed,
    remaining: total - completed,
    percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

export function getCategoryProgress(
  problems: Problem[],
  progress: ProgressMap,
  category: string,
): CategoryStats {
  const inCategory = problems.filter((problem) => problem.category === category);
  const completed = getCompletedProblems(inCategory, progress).length;
  return {
    category,
    total: inCategory.length,
    completed,
    percentage: inCategory.length === 0 ? 0 : Math.round((completed / inCategory.length) * 100),
  };
}

export function getCategoryStats(
  problems: Problem[],
  progress: ProgressMap,
  categories = [...new Set(problems.map((problem) => problem.category))],
): CategoryStats[] {
  return categories.map((category) => getCategoryProgress(problems, progress, category));
}

export function getRecentCompletedProblems(
  problems: Problem[],
  progress: ProgressMap,
  limit = 5,
): RecentProblem[] {
  return getCompletedProblems(problems, progress)
    .map((problem) => ({ problem, progress: progress[problem.id], session: getLatestCompletedSession(progress[problem.id]) }))
    .filter((item): item is RecentProblem => Boolean(item.progress?.completedAt))
    .sort((a, b) => (b.session?.endedAt ?? b.progress.completedAt ?? "").localeCompare(a.session?.endedAt ?? a.progress.completedAt ?? ""))
    .slice(0, limit);
}

export function getLatestCompletedSession(progress: ProblemProgress | undefined): StudySession | undefined {
  return progress?.sessions
    .filter((session) => Boolean(session.result))
    .sort((a, b) => b.endedAt.localeCompare(a.endedAt))[0];
}

/** Sessions with a result represent an intentional completed study attempt. */
export function getCompletedSessions(progress: ProgressMap): CompletedSession[] {
  return Object.entries(progress).flatMap(([problemId, item]) =>
    item.sessions.filter((session) => Boolean(session.result)).map((session) => ({ problemId, session })),
  );
}

export function getTotalStudyTime(progress: ProgressMap): number {
  return getCompletedSessions(progress).reduce((total, item) => total + item.session.durationSeconds, 0);
}

export function getAverageSolveTime(progress: ProgressMap): number {
  const sessions = getCompletedSessions(progress);
  if (sessions.length === 0) return 0;
  return Math.round(sessions.reduce((total, item) => total + item.session.durationSeconds, 0) / sessions.length);
}

export function getProblemStudyTime(progress: ProgressMap, problemId: string): number {
  return (progress[problemId]?.sessions ?? []).reduce((total, session) => total + session.durationSeconds, 0);
}

export function getCategoryAverageSolveTime(problems: Problem[], progress: ProgressMap, category: string): number {
  const ids = new Set(problems.filter((problem) => problem.category === category).map((problem) => problem.id));
  const sessions = getCompletedSessions(progress).filter((item) => ids.has(item.problemId));
  if (sessions.length === 0) return 0;
  return Math.round(sessions.reduce((total, item) => total + item.session.durationSeconds, 0) / sessions.length);
}

export function getStudySessionRecords(problems: Problem[], progress: ProgressMap): StudySessionRecord[] {
  const byId = new Map(problems.map((problem) => [problem.id, problem]));
  return getCompletedSessions(progress).flatMap(({ problemId, session }) => {
    const problem = byId.get(problemId);
    return problem ? [{ problemId, session, problem }] : [];
  });
}

export function formatDuration(durationSeconds?: number): string {
  const total = Math.max(0, Math.floor(durationSeconds ?? 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes} min${seconds ? ` ${seconds} sec` : ""}`;
  return `${seconds} sec`;
}

export function formatTimer(durationSeconds: number): string {
  const total = Math.max(0, Math.floor(durationSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

const sessionResultLabels: Record<SessionResult, string> = {
  independent: "Solved independently",
  needed_hint: "Needed a hint",
  needed_significant_help: "Needed significant help",
  looked_at_solution: "Looked at the solution",
};

export function formatSessionResult(result?: SessionResult): string {
  return result ? sessionResultLabels[result] : "Practice session";
}

export function formatCompletionDate(date?: string): string {
  if (!date) return "Completed recently";
  const completed = new Date(`${date}T00:00:00`);
  const now = new Date();
  const days = Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - completed.getTime()) / 86_400_000);
  if (days === 0) return "Completed today";
  if (days === 1) return "Completed yesterday";
  return `Completed ${completed.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}
