import type { Problem } from "../types/problem";
import type { ProblemProgress, ProgressMap } from "../types/progress";

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
    .map((problem) => ({ problem, progress: progress[problem.id] }))
    .filter((item): item is RecentProblem => Boolean(item.progress?.completedAt))
    .sort((a, b) => (b.progress.completedAt ?? "").localeCompare(a.progress.completedAt ?? ""))
    .slice(0, limit);
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
