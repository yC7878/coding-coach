import type { SessionResult, SyntaxMistake } from "./progress";

export type DataSource = "user" | "github" | "analysis" | "user_override";

export interface AnalysisValue<T> {
  value: T;
  source: DataSource;
  confidence?: number;
}

export interface DetectedSyntaxIssue {
  syntaxId: string;
  incorrectText: string;
  correctedText: string;
  source: "submission_comparison";
  confidence: "low" | "medium" | "high";
}

export type AlgorithmUnderstanding = "strong" | "developing" | "needs_support";

/** User overrides are stored apart from immutable GitHub sync results. */
export interface PerformanceDetails {
  solveTimeSeconds?: AnalysisValue<number>;
  result?: AnalysisValue<SessionResult>;
  confidence?: AnalysisValue<number>;
  algorithmUnderstanding?: AnalysisValue<AlgorithmUnderstanding>;
  pattern?: AnalysisValue<string>;
  syntaxIssues?: AnalysisValue<SyntaxMistake[]>;
  notes?: AnalysisValue<string>;
}

export type ScoreConfidence = "low" | "medium" | "high";

export interface SkillScore {
  score: number;
  sampleSize: number;
  confidence: ScoreConfidence;
  factors: ScoreFactor[];
}

export interface ScoreFactor {
  label: string;
  impact: number;
  reason: string;
}

export interface PerformanceProfile {
  algorithm: SkillScore;
  syntaxRecall: SkillScore;
  speed: SkillScore;
  confidence: SkillScore;
}

export interface CategoryPerformance {
  category: string;
  problemsAttempted: number;
  problemsCompleted: number;
  algorithmScore?: number;
  syntaxScore?: number;
  speedScore?: number;
  confidenceScore?: number;
  weaknessScore?: number;
  dataConfidence: ScoreConfidence;
  factors: ScoreFactor[];
}
