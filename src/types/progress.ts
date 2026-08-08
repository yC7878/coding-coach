export type ProblemStatus = "not_started" | "in_progress" | "completed";

export type SessionResult =
  | "independent"
  | "syntax_recall"
  | "syntax_help"
  | "algorithm_hint"
  | "significant_help"
  | "solution";

/** A specific Java API or syntax recall mistake captured during a study session. */
export interface SyntaxMistake {
  syntaxId: string;
  entered: string;
  expected: string;
}

/** An immutable record of one finished block of study for a problem. */
export interface StudySession {
  id: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  result?: SessionResult;
  confidence?: number;
  syntaxMistakes?: SyntaxMistake[];
  notes?: string;
  pausedDurationSeconds?: number;
}

/** The one session currently running in Phase 1, stored separately from history. */
export interface ActiveStudySession {
  id: string;
  problemId: string;
  startedAt: string;
  activeSegmentStartedAt?: string;
  accumulatedActiveSeconds: number;
  pausedDurationSeconds: number;
  isPaused: boolean;
  pausedAt?: string;
}

export interface ProblemProgress {
  status: ProblemStatus;
  sessions: StudySession[];
  completedAt?: string;
  /** Last reported confidence, retained for quick display and Phase 1 imports. */
  confidence?: number;
  // Reserved Phase 2 study signals. Keeping them optional avoids future migrations.
  attempts?: number;
  solveTimeMinutes?: number;
  hintsUsed?: number;
  solvedIndependently?: boolean;
  lastAttemptedAt?: string;
  reviewDate?: string;
}

export type ProgressMap = Record<string, ProblemProgress>;

export interface ProgressExport {
  version: 3;
  exportedAt: string;
  progress: ProgressMap;
}
