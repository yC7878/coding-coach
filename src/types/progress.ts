export type ProblemStatus = "not_started" | "in_progress" | "completed";

/**
 * Phase 1 stores only completion and confidence. The optional fields make the
 * shape safe to extend with Phase 2 study signals without a migration.
 */
export interface ProblemProgress {
  status: ProblemStatus;
  completedAt?: string;
  confidence?: number;
  attempts?: number;
  solveTimeMinutes?: number;
  hintsUsed?: number;
  solvedIndependently?: boolean;
  lastAttemptedAt?: string;
  reviewDate?: string;
}

export type ProgressMap = Record<string, ProblemProgress>;

export interface ProgressExport {
  version: 1;
  exportedAt: string;
  progress: ProgressMap;
}
