import { describe, expect, it } from "vitest";
import type { Problem } from "../types/problem";
import type { ProgressMap } from "../types/progress";
import {
  getAverageSolveTime,
  getCategoryAverageSolveTime,
  getCategoryProgress,
  getCompletedProblems,
  getCompletedSessions,
  getIncompleteProblems,
  getOverallProgress,
  getProblemStudyTime,
  getProblemSyntaxMistakes,
  getMostFrequentSyntaxMistakes,
  getSyntaxMistakeCount,
  getSyntaxMistakes,
  getSyntaxStats,
  getTotalStudyTime,
} from "./progress";
import { getTodayRecommendation } from "./recommendation";
import { getSyntaxPracticeQueue, validateSyntaxAnswer } from "./syntax";
import type { SyntaxReference } from "../types/syntax";

const problems: Problem[] = [
  { id: "one", title: "One", category: "Arrays & Hashing", difficulty: "Easy", neetcodeUrl: "https://example.com/one", patterns: ["Hash Map"] },
  { id: "two", title: "Two", category: "Arrays & Hashing", difficulty: "Medium", neetcodeUrl: "https://example.com/two", patterns: ["Hash Map"] },
  { id: "three", title: "Three", category: "Trees", difficulty: "Hard", neetcodeUrl: "https://example.com/three", patterns: ["DFS"] },
];
const progress: ProgressMap = {
  one: { status: "completed", completedAt: "2026-08-08", sessions: [{ id: "first", startedAt: "2026-08-08T20:00:00.000Z", endedAt: "2026-08-08T20:10:00.000Z", durationSeconds: 600, result: "syntax_recall", syntaxMistakes: [{ syntaxId: "arrays-equals", entered: "Arrays.equal(a, b)", expected: "Arrays.equals(a, b)" }] }] },
  two: { status: "completed", completedAt: "2026-08-09", sessions: [{ id: "second", startedAt: "2026-08-09T20:00:00.000Z", endedAt: "2026-08-09T20:40:00.000Z", durationSeconds: 2400, result: "algorithm_hint", syntaxMistakes: [{ syntaxId: "arrays-equals", entered: "Arrays.equal(a, b)", expected: "Arrays.equals(a, b)" }, { syntaxId: "hash-map-get", entered: "map.fetch(key)", expected: "map.get(key)" }] }] },
  three: { status: "in_progress", sessions: [] },
};

describe("progress calculations", () => {
  it("calculates overall dynamic totals", () => {
    expect(getOverallProgress(problems, progress)).toEqual({ total: 3, completed: 2, remaining: 1, percentage: 67 });
  });
  it("calculates a category's completed percentage", () => {
    expect(getCategoryProgress(problems, progress, "Arrays & Hashing")).toEqual({ category: "Arrays & Hashing", total: 2, completed: 2, percentage: 100 });
  });
  it("filters completed and incomplete problems", () => {
    expect(getCompletedProblems(problems, progress).map((problem) => problem.id)).toEqual(["one", "two"]);
    expect(getIncompleteProblems(problems, progress).map((problem) => problem.id)).toEqual(["three"]);
  });
});

describe("study-time analytics", () => {
  it("keeps multiple sessions and calculates reusable timing metrics", () => {
    expect(getCompletedSessions(progress)).toHaveLength(2);
    expect(getTotalStudyTime(progress)).toBe(3000);
    expect(getAverageSolveTime(progress)).toBe(1500);
    expect(getProblemStudyTime(progress, "two")).toBe(2400);
    expect(getCategoryAverageSolveTime(problems, progress, "Arrays & Hashing")).toBe(1500);
  });
});

describe("recommendations", () => {
  it("selects the first incomplete problem and returns future-ready metadata", () => {
    expect(getTodayRecommendation(problems, { progress })).toMatchObject({ problem: { id: "three" }, reason: expect.any(String), estimatedMinutes: 50 });
  });
});

const syntaxReferences: SyntaxReference[] = [
  { id: "arrays-equals", category: "Arrays", label: "Arrays.equals()", expression: "Arrays.equals(a, b)", method: "equals", fillPrompt: "boolean same = Arrays.____________(a, b);", freeRecallPrompt: "Compare arrays a and b.", hint: "The method is equals, not equal." },
  { id: "hash-map-get", category: "HashMap", label: "HashMap.get()", expression: "map.get(key)", method: "get", fillPrompt: "Value value = map.____________(key);", freeRecallPrompt: "Get key from map.", hint: "Use get." },
];

describe("syntax recall analytics", () => {
  it("keeps exact mistakes, counts frequency, and separates syntax data from result severity", () => {
    expect(getSyntaxMistakes(progress)).toHaveLength(3);
    expect(getSyntaxMistakeCount(progress, "arrays-equals")).toBe(2);
    expect(getProblemSyntaxMistakes(progress, "two")).toHaveLength(2);
    expect(getMostFrequentSyntaxMistakes(progress)).toEqual([{ syntaxId: "arrays-equals", count: 2 }, { syntaxId: "hash-map-get", count: 1 }]);
    expect(getSyntaxStats(progress)).toMatchObject({ totalMistakes: 3, affectedApis: 2 });
  });

  it("prioritizes frequent mistakes and validates Java API answers", () => {
    expect(getSyntaxPracticeQueue(syntaxReferences, progress).map((item) => item.syntax.id)).toEqual(["arrays-equals", "hash-map-get"]);
    expect(validateSyntaxAnswer(syntaxReferences[0], "free_recall", "Arrays.equals(a, b);").correct).toBe(true);
    expect(validateSyntaxAnswer(syntaxReferences[0], "free_recall", "Arrays.equal(a, b)")).toMatchObject({ correct: false, expected: "Arrays.equals(a, b)" });
    expect(validateSyntaxAnswer(syntaxReferences[0], "fill_blank", "equals()").correct).toBe(true);
  });
});
