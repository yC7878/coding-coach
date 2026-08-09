import { describe, expect, it } from "vitest";
import { getTodayRecommendation } from "./recommendationService";
import type { Problem } from "../types/problem";
import type { CategoryPerformance } from "../types/performance";
import type { ProgressMap } from "../types/progress";

const problems: Problem[] = [
  { id: "complete", title: "Completed", category: "Arrays & Hashing", difficulty: "Easy", neetcodeUrl: "https://example.com/complete", patterns: ["Hash Map"] },
  { id: "weak-easy", title: "Weak Easy", category: "Sliding Window", difficulty: "Easy", neetcodeUrl: "https://example.com/easy", patterns: ["Sliding Window"] },
  { id: "weak-medium", title: "Weak Medium", category: "Sliding Window", difficulty: "Medium", neetcodeUrl: "https://example.com/medium", patterns: ["Sliding Window"] },
  { id: "strong-medium", title: "Strong Medium", category: "Arrays & Hashing", difficulty: "Medium", neetcodeUrl: "https://example.com/strong", patterns: ["Hash Map"] },
];

const categoryPerformance: CategoryPerformance[] = [
  { category: "Sliding Window", problemsAttempted: 3, problemsCompleted: 2, algorithmScore: 45, syntaxScore: 75, speedScore: 60, confidenceScore: 50, weaknessScore: 58, dataConfidence: "medium", factors: [] },
  { category: "Arrays & Hashing", problemsAttempted: 4, problemsCompleted: 3, algorithmScore: 90, weaknessScore: 10, dataConfidence: "medium", factors: [] },
];

describe("adaptive recommendation", () => {
  it("prioritizes an incomplete, difficulty-appropriate problem in a weak category with factors", () => {
    const progress: ProgressMap = { complete: { status: "completed", sessions: [] } };
    const recommendation = getTodayRecommendation({ problems, progress, categoryPerformance });
    expect(recommendation).toMatchObject({ problem: { id: "weak-easy" }, hasEnoughData: true });
    expect(recommendation?.factors).toEqual(expect.arrayContaining([expect.objectContaining({ label: "Weak category" }), expect.objectContaining({ label: "Appropriate difficulty" })]));
    expect(recommendation?.factors.some((factor) => factor.label === "Weak category" && factor.reason.includes("Sliding Window"))).toBe(true);
  });

  it("falls back to deterministic study order while gathering evidence", () => {
    const recommendation = getTodayRecommendation({ problems: problems.slice(1), progress: {}, categoryPerformance: [] });
    expect(recommendation).toMatchObject({ problem: { id: "weak-easy" }, hasEnoughData: false });
    expect(recommendation?.reason).toContain("still learning");
  });

  it("returns nothing when every problem is complete", () => {
    const progress: ProgressMap = Object.fromEntries(problems.map((problem) => [problem.id, { status: "completed", sessions: [] }]));
    expect(getTodayRecommendation({ problems, progress, categoryPerformance })).toBeUndefined();
  });
});
