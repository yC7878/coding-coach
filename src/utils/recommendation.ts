import type { Problem } from "../types/problem";
import type { ProgressMap } from "../types/progress";
import { getIncompleteProblems } from "./progress";

/**
 * The input deliberately leaves room for Phase 2 analytics and Phase 3 goals.
 * Phase 1 simply preserves NeetCode's category order and selects the first
 * incomplete problem.
 */
export interface RecommendationContext {
  progress: ProgressMap;
  analytics?: unknown;
  goals?: unknown;
}

export interface Recommendation {
  problem: Problem;
  reason: string;
  estimatedMinutes: number;
}

const estimatedMinutes = { Easy: 20, Medium: 35, Hard: 50 } as const;

export function getTodayRecommendation(problems: Problem[], context: RecommendationContext): Recommendation | undefined {
  const problem = getIncompleteProblems(problems, context.progress)[0];
  if (!problem) return undefined;
  return {
    problem,
    reason: "It’s the next incomplete problem in your guided study path.",
    estimatedMinutes: estimatedMinutes[problem.difficulty],
  };
}
