import { beforeEach, describe, expect, it } from "vitest";
import type { Problem } from "../types/problem";
import type { ProgressMap } from "../types/progress";
import { getCategoryProgress, getCompletedProblems, getIncompleteProblems, getOverallProgress } from "./progress";

const problems: Problem[] = [
  { id: "one", title: "One", category: "Arrays & Hashing", difficulty: "Easy", neetcodeUrl: "https://example.com/one", patterns: ["Hash Map"] },
  { id: "two", title: "Two", category: "Arrays & Hashing", difficulty: "Medium", neetcodeUrl: "https://example.com/two", patterns: ["Hash Map"] },
  { id: "three", title: "Three", category: "Trees", difficulty: "Hard", neetcodeUrl: "https://example.com/three", patterns: ["DFS"] },
];
const progress: ProgressMap = { one: { status: "completed", completedAt: "2026-08-08" }, three: { status: "in_progress" } };

describe("progress calculations", () => {
  it("calculates overall dynamic totals", () => {
    expect(getOverallProgress(problems, progress)).toEqual({ total: 3, completed: 1, remaining: 2, percentage: 33 });
  });
  it("calculates a category's completed percentage", () => {
    expect(getCategoryProgress(problems, progress, "Arrays & Hashing")).toEqual({ category: "Arrays & Hashing", total: 2, completed: 1, percentage: 50 });
  });
  it("filters completed and incomplete problems", () => {
    expect(getCompletedProblems(problems, progress).map((problem) => problem.id)).toEqual(["one"]);
    expect(getIncompleteProblems(problems, progress).map((problem) => problem.id)).toEqual(["two", "three"]);
  });
});
