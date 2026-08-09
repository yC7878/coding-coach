import type { Problem } from "../types/problem";
import type { ProgressMap } from "../types/progress";
import type { CategoryPerformance, ScoreFactor } from "../types/performance";

export interface Phase2Recommendation {
  problem: Problem;
  reason: string;
  estimatedMinutes: number;
  score: number;
  factors: ScoreFactor[];
  hasEnoughData: boolean;
}

export interface RecommendationInput {
  problems: Problem[];
  progress: ProgressMap;
  categoryPerformance: CategoryPerformance[];
}

const estimatedMinutes = { Easy: 20, Medium: 35, Hard: 50 } as const;

function difficultyFit(problem: Problem, category?: CategoryPerformance): number {
  const algorithm = category?.algorithmScore;
  if (algorithm === undefined) return problem.difficulty === "Easy" ? 15 : 8;
  if (algorithm < 60) return problem.difficulty === "Easy" ? 18 : problem.difficulty === "Medium" ? 12 : 2;
  if (algorithm < 80) return problem.difficulty === "Medium" ? 18 : problem.difficulty === "Easy" ? 12 : 8;
  return problem.difficulty === "Hard" ? 18 : problem.difficulty === "Medium" ? 14 : 8;
}

export function getTodayRecommendation(input: RecommendationInput): Phase2Recommendation | undefined {
  const incomplete = input.problems.filter((problem) => input.progress[problem.id]?.status !== "completed");
  if (!incomplete.length) return undefined;
  const byCategory = new Map(input.categoryPerformance.map((item) => [item.category, item]));
  const hasEnoughData = input.categoryPerformance.some((item) => item.dataConfidence !== "low" && item.weaknessScore !== undefined);
  const scored = incomplete.map((problem, index) => {
    const category = byCategory.get(problem.category);
    const weaknessImpact = category?.dataConfidence !== "low" && category?.weaknessScore !== undefined ? Math.round(category.weaknessScore * 0.3) : 0;
    const freshnessImpact = input.progress[problem.id]?.sessions.length ? 5 : 20;
    const difficultyImpact = difficultyFit(problem, category);
    const factors: ScoreFactor[] = [
      ...(weaknessImpact ? [{ label: "Weak category", impact: weaknessImpact, reason: `${problem.category} has a higher explainable weakness score.` }] : []),
      { label: "Not recently practiced", impact: freshnessImpact, reason: input.progress[problem.id]?.sessions.length ? "This problem has prior session history." : "No prior session is recorded for this problem." },
      { label: "Appropriate difficulty", impact: difficultyImpact, reason: `${problem.difficulty} is selected using the current category evidence.` },
      { label: "Study path order", impact: Math.max(1, 10 - Math.floor(index / 10)), reason: "Keeps the curated NeetCode order as a deterministic tie-breaker." },
    ];
    return { problem, score: factors.reduce((total, factor) => total + factor.impact, 0), factors, category };
  }).sort((a, b) => b.score - a.score || input.problems.indexOf(a.problem) - input.problems.indexOf(b.problem));
  const chosen = scored[0];
  return {
    problem: chosen.problem,
    estimatedMinutes: estimatedMinutes[chosen.problem.difficulty],
    score: chosen.score,
    factors: chosen.factors,
    hasEnoughData,
    reason: hasEnoughData && chosen.category?.weaknessScore !== undefined
      ? `${chosen.problem.category} is one of the areas with the strongest current evidence for focused practice.`
      : `We’re still learning your strengths. This builds useful data in ${chosen.problem.category}.`,
  };
}
