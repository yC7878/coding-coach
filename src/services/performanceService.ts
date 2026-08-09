import type { ProblemProgress, SessionResult, SyntaxMistake } from "../types/progress";
import type { AnalysisValue, PerformanceDetails } from "../types/performance";
import { getLatestCompletedSession } from "../utils/progress";

export interface EffectivePerformanceDetails {
  solveTimeSeconds?: AnalysisValue<number>;
  result?: AnalysisValue<SessionResult>;
  confidence?: AnalysisValue<number>;
  syntaxIssues?: AnalysisValue<SyntaxMistake[]>;
  notes?: AnalysisValue<string>;
  pattern?: AnalysisValue<string>;
  algorithmUnderstanding?: PerformanceDetails["algorithmUnderstanding"];
}

const userValue = <T>(value: T): AnalysisValue<T> => ({ value, source: "user" });

/** Resolves user overrides first while retaining the original submitted/session data separately. */
export function getEffectivePerformanceDetails(progress: ProblemProgress | undefined): EffectivePerformanceDetails {
  const latest = getLatestCompletedSession(progress);
  const override = progress?.performance;
  return {
    ...(override?.solveTimeSeconds ?? (latest ? userValue(latest.durationSeconds) : undefined) ? { solveTimeSeconds: override?.solveTimeSeconds ?? userValue(latest!.durationSeconds) } : {}),
    ...(override?.result ?? (latest?.result ? userValue(latest.result) : undefined) ? { result: override?.result ?? userValue(latest!.result!) } : {}),
    ...(override?.confidence ?? (latest?.confidence ? userValue(latest.confidence) : undefined) ? { confidence: override?.confidence ?? userValue(latest!.confidence!) } : {}),
    ...(override?.syntaxIssues ?? (latest?.syntaxMistakes ? userValue(latest.syntaxMistakes) : undefined) ? { syntaxIssues: override?.syntaxIssues ?? userValue(latest!.syntaxMistakes ?? []) } : {}),
    ...(override?.notes ?? (latest?.notes ? userValue(latest.notes) : undefined) ? { notes: override?.notes ?? userValue(latest!.notes!) } : {}),
    ...(override?.pattern ? { pattern: override.pattern } : {}),
    ...(override?.algorithmUnderstanding ? { algorithmUnderstanding: override.algorithmUnderstanding } : {}),
  };
}

/** Merges explicit user edits without mutating the original sessions or GitHub analysis cache. */
export function applyPerformanceOverride(current: PerformanceDetails | undefined, changes: Omit<PerformanceDetails, never>): PerformanceDetails {
  const next: PerformanceDetails = { ...current };
  if ("solveTimeSeconds" in changes) changes.solveTimeSeconds === undefined ? delete next.solveTimeSeconds : next.solveTimeSeconds = changes.solveTimeSeconds;
  if ("result" in changes) changes.result === undefined ? delete next.result : next.result = changes.result;
  if ("confidence" in changes) changes.confidence === undefined ? delete next.confidence : next.confidence = changes.confidence;
  if ("algorithmUnderstanding" in changes) changes.algorithmUnderstanding === undefined ? delete next.algorithmUnderstanding : next.algorithmUnderstanding = changes.algorithmUnderstanding;
  if ("pattern" in changes) changes.pattern === undefined ? delete next.pattern : next.pattern = changes.pattern;
  if ("syntaxIssues" in changes) changes.syntaxIssues === undefined ? delete next.syntaxIssues : next.syntaxIssues = changes.syntaxIssues;
  if ("notes" in changes) changes.notes === undefined ? delete next.notes : next.notes = changes.notes;
  return next;
}
