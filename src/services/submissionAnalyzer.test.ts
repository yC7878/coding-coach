import { describe, expect, it } from "vitest";
import { analyzeSubmission, analyzeSubmissionHistory, compareSubmissions, detectJavaApiUsage } from "./submissionAnalyzer";
import type { GithubSubmission } from "../types/github";

const submission = (id: string, filename: string, sourceCode: string, problemId = "valid-anagram"): GithubSubmission => ({
  id,
  problemId,
  repositorySlug: "is-anagram",
  filename,
  path: `Data Structures & Algorithms/is-anagram/${filename}`,
  language: "Java",
  sourceCode,
});

describe("submission analyzer", () => {
  it("detects known Java APIs without treating normal usage as a syntax issue", () => {
    const source = "Arrays.sort(nums); boolean same = Arrays.equals(a, b); int count = map.getOrDefault(key, 0);";
    expect(detectJavaApiUsage(source)).toEqual(expect.arrayContaining([
      { syntaxId: "arrays-sort", occurrences: 1 },
      { syntaxId: "arrays-equals", occurrences: 1 },
      { syntaxId: "hash-map-get-or-default", occurrences: 1 },
    ]));
    expect(analyzeSubmission(submission("one", "submission-0.java", source))).toEqual({
      submissionId: "one",
      detectedApis: expect.any(Array),
    });
  });

  it("keeps receivers specific so list APIs are not mislabeled as HashMap APIs", () => {
    const detected = detectJavaApiUsage("String name = list.get(0);");
    expect(detected).toContainEqual({ syntaxId: "list-get", occurrences: 1 });
    expect(detected).not.toContainEqual({ syntaxId: "hash-map-get", occurrences: 1 });
  });

  it("labels a one-character correction as possible only when a later known API supports it", () => {
    const comparison = compareSubmissions(
      submission("early", "submission-0.java", "return Arrays.equal(a, b);"),
      submission("later", "submission-1.java", "return Arrays.equals(a, b);"),
    );
    expect(comparison.addedApis).toContain("arrays-equals");
    expect(comparison.detectedSyntaxIssues).toEqual([expect.objectContaining({
      syntaxId: "arrays-equals",
      incorrectText: "Arrays.equal(",
      correctedText: "Arrays.equals(a, b)",
      source: "submission_comparison",
      confidence: "high",
    })]);
  });

  it("compares consecutive submissions only within the same problem", () => {
    const history = analyzeSubmissionHistory([
      submission("a0", "submission-0.java", "Arrays.sort(a);", "contains-duplicate"),
      submission("a1", "submission-1.java", "Arrays.equals(a, b);", "contains-duplicate"),
      submission("b0", "submission-0.java", "Math.max(a, b);", "two-sum"),
    ]);
    expect(history.analyses).toHaveLength(3);
    expect(history.comparisons).toEqual([expect.objectContaining({ fromSubmissionId: "a0", toSubmissionId: "a1" })]);
  });
});
