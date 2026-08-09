import { weaknessWeights } from "../config/weaknessWeights";
import type { Problem } from "../types/problem";
import type { ProgressMap, SessionResult } from "../types/progress";
import type { CategoryPerformance, PerformanceProfile, ScoreConfidence, ScoreFactor, SkillScore } from "../types/performance";
import { getEffectivePerformanceDetails } from "./performanceService";

interface SessionEvidence {
  problem: Problem;
  result?: SessionResult;
  durationSeconds: number;
  confidence?: number;
  syntaxMistakeCount: number;
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const confidenceFor = (sampleSize: number): ScoreConfidence => sampleSize >= 6 ? "high" : sampleSize >= weaknessWeights.minimumSampleSize ? "medium" : "low";
const average = (values: number[]) => values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;

function evidenceFor(problems: Problem[], progress: ProgressMap): SessionEvidence[] {
  const byId = new Map(problems.map((problem) => [problem.id, problem]));
  return Object.entries(progress).flatMap(([problemId, item]) => {
    const problem = byId.get(problemId);
    if (!problem) return [];
    const completed = item.sessions.filter((session) => Boolean(session.result));
    return completed.map((session, index) => {
      const isLatest = index === completed.length - 1;
      const effective = isLatest ? getEffectivePerformanceDetails(item) : undefined;
      return {
        problem,
        result: effective?.result?.value ?? session.result,
        durationSeconds: effective?.solveTimeSeconds?.value ?? session.durationSeconds,
        confidence: effective?.confidence?.value ?? session.confidence,
        syntaxMistakeCount: effective?.syntaxIssues?.value.length ?? session.syntaxMistakes?.length ?? 0,
      };
    });
  });
}

function resultCount(evidence: SessionEvidence[], result: SessionResult) { return evidence.filter((item) => item.result === result).length; }

function algorithmScore(evidence: SessionEvidence[]): SkillScore {
  const values = evidence.flatMap((item) => item.result ? [weaknessWeights.algorithmByResult[item.result]] : []);
  const factors: ScoreFactor[] = [];
  const independent = resultCount(evidence, "independent");
  const hints = resultCount(evidence, "algorithm_hint");
  const solutions = resultCount(evidence, "solution");
  if (hints) factors.push({ label: "Algorithm hints", impact: hints * 12, reason: `Needed algorithm/pattern hints on ${hints} ${hints === 1 ? "session" : "sessions"}.` });
  if (solutions) factors.push({ label: "Solution viewed", impact: solutions * 20, reason: `Needed the solution on ${solutions} ${solutions === 1 ? "session" : "sessions"}.` });
  if (independent) factors.push({ label: "Independent solves", impact: -independent * 8, reason: `Solved ${independent} ${independent === 1 ? "session" : "sessions"} independently.` });
  return { score: values.length ? clamp(average(values)) : 0, sampleSize: values.length, confidence: confidenceFor(values.length), factors };
}

function syntaxScore(evidence: SessionEvidence[]): SkillScore {
  const values = evidence.flatMap((item) => item.result ? [Math.max(0, weaknessWeights.syntaxByResult[item.result] - item.syntaxMistakeCount * weaknessWeights.syntaxMistakePenalty)] : []);
  const mistakes = evidence.reduce((total, item) => total + item.syntaxMistakeCount, 0);
  const recall = resultCount(evidence, "syntax_recall");
  const help = resultCount(evidence, "syntax_help");
  const factors: ScoreFactor[] = [];
  if (mistakes) factors.push({ label: "Recorded syntax mistakes", impact: mistakes * 5, reason: `${mistakes} exact syntax/API ${mistakes === 1 ? "mistake was" : "mistakes were"} recorded.` });
  if (recall) factors.push({ label: "Syntax recall slips", impact: recall * 7, reason: `${recall} session${recall === 1 ? "" : "s"} included a small recall mistake.` });
  if (help) factors.push({ label: "Syntax/API help", impact: help * 12, reason: `${help} session${help === 1 ? "" : "s"} required syntax/API help.` });
  return { score: values.length ? clamp(average(values)) : 0, sampleSize: values.length, confidence: confidenceFor(values.length), factors };
}

function speedScore(evidence: SessionEvidence[]): SkillScore {
  const values = evidence.filter((item) => item.durationSeconds > 0).map((item) => clamp((weaknessWeights.targetSolveSeconds[item.problem.difficulty] / item.durationSeconds) * 100));
  const slow = evidence.filter((item) => item.durationSeconds > weaknessWeights.targetSolveSeconds[item.problem.difficulty]).length;
  const factors: ScoreFactor[] = slow ? [{ label: "Above target solve time", impact: slow * 6, reason: `${slow} session${slow === 1 ? " was" : "s were"} above the initial difficulty-based target.` }] : [];
  return { score: values.length ? clamp(average(values)) : 0, sampleSize: values.length, confidence: confidenceFor(values.length), factors };
}

function confidenceScore(evidence: SessionEvidence[]): SkillScore {
  const values = evidence.flatMap((item) => item.confidence ? [item.confidence * weaknessWeights.confidenceScale] : []);
  const low = evidence.filter((item) => (item.confidence ?? 5) <= 2).length;
  const factors: ScoreFactor[] = low ? [{ label: "Low self-reported confidence", impact: low * 8, reason: `${low} session${low === 1 ? " had" : "s had"} confidence of 2/5 or lower.` }] : [];
  return { score: values.length ? clamp(average(values)) : 0, sampleSize: values.length, confidence: confidenceFor(values.length), factors };
}

export function getPerformanceProfile(problems: Problem[], progress: ProgressMap, category?: string): PerformanceProfile {
  const evidence = evidenceFor(problems, progress).filter((item) => !category || item.problem.category === category);
  return { algorithm: algorithmScore(evidence), syntaxRecall: syntaxScore(evidence), speed: speedScore(evidence), confidence: confidenceScore(evidence) };
}

export function getCategoryPerformance(problems: Problem[], progress: ProgressMap, categories = [...new Set(problems.map((problem) => problem.category))]): CategoryPerformance[] {
  return categories.map((category) => {
    const categoryProblems = problems.filter((problem) => problem.category === category);
    const attempted = categoryProblems.filter((problem) => (progress[problem.id]?.sessions.length ?? 0) > 0);
    const completed = categoryProblems.filter((problem) => progress[problem.id]?.status === "completed");
    const profile = getPerformanceProfile(problems, progress, category);
    const weighted = weaknessWeights.categoryWeight;
    const availableScores = [
      { skill: profile.algorithm, weight: weighted.algorithm },
      { skill: profile.syntaxRecall, weight: weighted.syntax },
      { skill: profile.speed, weight: weighted.speed },
      { skill: profile.confidence, weight: weighted.confidence },
    ].filter((item) => item.skill.sampleSize > 0);
    const score = availableScores.length
      ? 100 - availableScores.reduce((total, item) => total + item.skill.score * item.weight, 0) / availableScores.reduce((total, item) => total + item.weight, 0)
      : undefined;
    const factors = [...profile.algorithm.factors, ...profile.syntaxRecall.factors, ...profile.speed.factors, ...profile.confidence.factors].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    const sampleSize = Math.max(profile.algorithm.sampleSize, profile.syntaxRecall.sampleSize, profile.speed.sampleSize, profile.confidence.sampleSize);
    return { category, problemsAttempted: attempted.length, problemsCompleted: completed.length, ...(profile.algorithm.sampleSize ? { algorithmScore: profile.algorithm.score } : {}), ...(profile.syntaxRecall.sampleSize ? { syntaxScore: profile.syntaxRecall.score } : {}), ...(profile.speed.sampleSize ? { speedScore: profile.speed.score } : {}), ...(profile.confidence.sampleSize ? { confidenceScore: profile.confidence.score } : {}), ...(score === undefined ? {} : { weaknessScore: clamp(score) }), dataConfidence: confidenceFor(sampleSize), factors };
  });
}

export function getFocusAreas(categoryPerformance: CategoryPerformance[], profile: PerformanceProfile): string[] {
  const categories = categoryPerformance.filter((item) => item.dataConfidence !== "low" && item.weaknessScore !== undefined).sort((a, b) => (b.weaknessScore ?? 0) - (a.weaknessScore ?? 0)).slice(0, 2).map((item) => item.category);
  if (profile.syntaxRecall.confidence !== "low" && profile.syntaxRecall.score < 75) categories.push("Java API Recall");
  return categories.slice(0, 3);
}
