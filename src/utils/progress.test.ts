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
  getTotalStudyTime,
} from "./progress";
import { getTodayRecommendation } from "./recommendation";

const problems: Problem[] = [
  { id: "one", title: "One", category: "Arrays & Hashing", difficulty: "Easy", neetcodeUrl: "https://example.com/one", patterns: ["Hash Map"] },
  { id: "two", title: "Two", category: "Arrays & Hashing", difficulty: "Medium", neetcodeUrl: "https://example.com/two", patterns: ["Hash Map"] },
  { id: "three", title: "Three", category: "Trees", difficulty: "Hard", neetcodeUrl: "https://example.com/three", patterns: ["DFS"] },
];
const progress: ProgressMap = {
  one: { status: "completed", completedAt: "2026-08-08", sessions: [{ id: "first", startedAt: "2026-08-08T20:00:00.000Z", endedAt: "2026-08-08T20:10:00.000Z", durationSeconds: 600, result: "independent" }] },
  two: { status: "completed", completedAt: "2026-08-09", sessions: [{ id: "second", startedAt: "2026-08-09T20:00:00.000Z", endedAt: "2026-08-09T20:40:00.000Z", durationSeconds: 2400, result: "needed_hint" }] },
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
