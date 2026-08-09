import syntaxData from "../data/syntax.json";
import type { DetectedApiUsage, GithubSubmission, SubmissionAnalysis, SubmissionComparison } from "../types/github";
import type { DetectedSyntaxIssue } from "../types/performance";
import type { SyntaxReference } from "../types/syntax";

const syntaxReferences = syntaxData as SyntaxReference[];
const staticOwners = new Set(["Arrays", "Math", "Character"]);

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function usagePattern(syntax: SyntaxReference): RegExp {
  const [owner] = syntax.label.split(".");
  if (staticOwners.has(owner)) return new RegExp(`\\b${escapeRegex(owner)}\\s*\\.\\s*${escapeRegex(syntax.method)}\\s*\\(`, "g");
  // The syntax dataset provides representative receiver names (map, set, deque, etc.).
  // Keeping that receiver in the pattern avoids falsely labeling `list.get()` as
  // `HashMap.get()` simply because the method names match.
  const receiver = syntax.expression.split(".")[0];
  return new RegExp(`\\b${escapeRegex(receiver)}\\s*\\.\\s*${escapeRegex(syntax.method)}\\s*\\(`, "g");
}

function countMatches(sourceCode: string, pattern: RegExp): number {
  return [...sourceCode.matchAll(pattern)].length;
}

export function detectJavaApiUsage(sourceCode: string): DetectedApiUsage[] {
  return syntaxReferences.flatMap((syntax) => {
    const occurrences = countMatches(sourceCode, usagePattern(syntax));
    return occurrences ? [{ syntaxId: syntax.id, occurrences }] : [];
  });
}

export function analyzeSubmission(submission: GithubSubmission): SubmissionAnalysis {
  return {
    submissionId: submission.id,
    detectedApis: submission.language === "Java" ? detectJavaApiUsage(submission.sourceCode) : [],
  };
}

function sortBySubmissionIndex(submissions: GithubSubmission[]): GithubSubmission[] {
  const index = (submission: GithubSubmission) => Number(submission.filename.match(/submission-(\d+)/)?.[1] ?? Number.MAX_SAFE_INTEGER);
  return [...submissions].sort((a, b) => index(a) - index(b) || a.filename.localeCompare(b.filename));
}

function findProbableSyntaxCorrections(previousCode: string, nextCode: string): DetectedSyntaxIssue[] {
  return syntaxReferences.flatMap((syntax) => {
    const correctPattern = usagePattern(syntax);
    if (!correctPattern.test(nextCode)) return [];
    correctPattern.lastIndex = 0;
    const shortened = syntax.method.length > 2 ? syntax.method.slice(0, -1) : "";
    if (!shortened) return [];
    const [owner] = syntax.label.split(".");
    const typoPattern = staticOwners.has(owner)
      ? new RegExp(`\\b${escapeRegex(owner)}\\s*\\.\\s*${escapeRegex(shortened)}\\s*\\(`)
      : new RegExp(`\\b${escapeRegex(syntax.expression.split(".")[0])}\\s*\\.\\s*${escapeRegex(shortened)}\\s*\\(`);
    const typo = previousCode.match(typoPattern)?.[0];
    if (!typo) return [];
    return [{
      syntaxId: syntax.id,
      incorrectText: typo.trim(),
      correctedText: syntax.expression,
      source: "submission_comparison" as const,
      confidence: staticOwners.has(owner) ? "high" as const : "medium" as const,
    }];
  });
}

export function compareSubmissions(from: GithubSubmission, to: GithubSubmission): SubmissionComparison {
  const fromApis = new Set(analyzeSubmission(from).detectedApis.map((api) => api.syntaxId));
  const toApis = new Set(analyzeSubmission(to).detectedApis.map((api) => api.syntaxId));
  const addedApis = [...toApis].filter((api) => !fromApis.has(api));
  const removedApis = [...fromApis].filter((api) => !toApis.has(api));
  const detectedSyntaxIssues = from.language === "Java" && to.language === "Java" ? findProbableSyntaxCorrections(from.sourceCode, to.sourceCode) : [];
  return {
    fromSubmissionId: from.id,
    toSubmissionId: to.id,
    addedApis,
    removedApis,
    ...(addedApis.length && removedApis.length ? { changedApproach: "Possible API substitution" } : {}),
    ...(addedApis.length || removedApis.length ? { notes: ["Detected change in known Java API usage; intent is not inferred."] } : {}),
    ...(detectedSyntaxIssues.length ? { detectedSyntaxIssues } : {}),
  };
}

export function analyzeSubmissionHistory(submissions: GithubSubmission[]): { analyses: SubmissionAnalysis[]; comparisons: SubmissionComparison[] } {
  const byProblem = new Map<string, GithubSubmission[]>();
  submissions.forEach((submission) => {
    const key = submission.problemId ?? submission.repositorySlug;
    byProblem.set(key, [...(byProblem.get(key) ?? []), submission]);
  });
  return {
    analyses: submissions.map(analyzeSubmission),
    comparisons: [...byProblem.values()].flatMap((history) => {
      const ordered = sortBySubmissionIndex(history);
      return ordered.slice(1).map((submission, index) => compareSubmissions(ordered[index], submission));
    }),
  };
}
