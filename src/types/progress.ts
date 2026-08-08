export type ProblemStatus = "not_started" | "in_progress" | "completed";

export type SessionResult =
  | "independent"
  | "needed_hint"
  | "needed_significant_help"
  | "looked_at_solution";

/** An immutable record of one finished block of study for a problem. */
export interface StudySession {
  id: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  result?: SessionResult;
  confidence?: number;
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
  version: 2;
  exportedAt: string;
  progress: ProgressMap;
}
