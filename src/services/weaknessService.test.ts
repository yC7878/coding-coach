import { describe, expect, it } from "vitest";
import { getCategoryPerformance, getFocusAreas, getPerformanceProfile } from "./weaknessService";
import type { Problem } from "../types/problem";
import type { ProgressMap } from "../types/progress";

const problems: Problem[] = [
  { id: "slide-one", title: "Slide One", category: "Sliding Window", difficulty: "Easy", neetcodeUrl: "https://example.com/1", patterns: ["Sliding Window"] },
  { id: "slide-two", title: "Slide Two", category: "Sliding Window", difficulty: "Easy", neetcodeUrl: "https://example.com/2", patterns: ["Sliding Window"] },
  { id: "slide-three", title: "Slide Three", category: "Sliding Window", difficulty: "Easy", neetcodeUrl: "https://example.com/3", patterns: ["Sliding Window"] },
  { id: "array-one", title: "Array One", category: "Arrays & Hashing", difficulty: "Easy", neetcodeUrl: "https://example.com/4", patterns: ["Hash Map"] },
];

const session = (id: string, result: "algorithm_hint" | "solution" | "independent", durationSeconds: number, confidence: number, syntaxMistakes = 0) => ({
  id,
  startedAt: "2026-08-08T20:00:00.000Z",
  endedAt: "2026-08-08T20:20:00.000Z",
  durationSeconds,
  result,
  confidence,
  ...(syntaxMistakes ? { syntaxMistakes: Array.from({ length: syntaxMistakes }, (_, index) => ({ syntaxId: `api-${index}`, entered: "wrong", expected: "right" })) } : {}),
});

describe("weakness scoring", () => {
  it("scores algorithm, syntax, speed, and confidence independently with explainable factors", () => {
    const progress: ProgressMap = {
      "slide-one": { status: "completed", sessions: [session("one", "algorithm_hint", 1200, 2, 1)] },
      "slide-two": { status: "completed", sessions: [session("two", "solution", 1500, 2)] },
      "slide-three": { status: "completed", sessions: [session("three", "independent", 600, 4)] },
    };
    const profile = getPerformanceProfile(problems, progress, "Sliding Window");
    expect(profile.algorithm).toMatchObject({ score: 55, sampleSize: 3, confidence: "medium" });
    expect(profile.syntaxRecall.score).not.toBe(profile.algorithm.score);
    expect(profile.speed.score).toBeLessThan(100);
    expect(profile.confidence.score).toBeLessThan(60);
    expect(profile.algorithm.factors).toEqual(expect.arrayContaining([expect.objectContaining({ label: "Algorithm hints" }), expect.objectContaining({ label: "Solution viewed" })]));
  });

  it("handles low samples responsibly and aggregates category scores", () => {
    const progress: ProgressMap = {
      "slide-one": { status: "completed", sessions: [session("only", "independent", 600, 5)] },
    };
    const profile = getPerformanceProfile(problems, progress, "Sliding Window");
    expect(profile.algorithm.confidence).toBe("low");
    const categories = getCategoryPerformance(problems, progress, ["Sliding Window", "Arrays & Hashing"]);
    expect(categories[0]).toMatchObject({ problemsAttempted: 1, problemsCompleted: 1, dataConfidence: "low" });
    expect(categories[1]).toMatchObject({ problemsAttempted: 0, problemsCompleted: 0, dataConfidence: "low" });
    expect(getFocusAreas(categories, profile)).toEqual([]);
  });
});
