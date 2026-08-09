import type { DetectedSyntaxIssue } from "./performance";

export interface ProblemRepositoryMapping {
  problemId: string;
  repositorySlug: string;
}

export interface GithubSubmission {
  id: string;
  problemId?: string;
  repositorySlug: string;
  filename: string;
  path: string;
  language: string;
  submittedAt?: string;
  sourceCode: string;
  commitSha?: string;
}

export interface RepositoryProblem {
  repositorySlug: string;
  categoryPath: string;
  files: GithubRepositoryFile[];
}

export interface GithubRepositoryFile {
  name: string;
  path: string;
  sha?: string;
  type: "file";
}

export interface DetectedApiUsage {
  syntaxId: string;
  occurrences: number;
}

export interface SubmissionComparison {
  fromSubmissionId: string;
  toSubmissionId: string;
  addedApis: string[];
  removedApis: string[];
  changedApproach?: string;
  notes?: string[];
  detectedSyntaxIssues?: DetectedSyntaxIssue[];
}

export interface SubmissionAnalysis {
  submissionId: string;
  detectedApis: DetectedApiUsage[];
}

export interface GithubSyncError {
  message: string;
  kind: "network" | "rate_limit" | "malformed_response" | "repository" | "unknown";
}

export interface GithubSyncCache {
  version: 1;
  repository: string;
  lastSyncAt?: string;
  discoveredProblems: RepositoryProblem[];
  submissions: GithubSubmission[];
  analyses: SubmissionAnalysis[];
  comparisons: SubmissionComparison[];
  unmappedRepositorySlugs: string[];
  lastError?: GithubSyncError;
}

export interface GithubSyncResult {
  cache: GithubSyncCache;
  synced: boolean;
  usedCache: boolean;
}
