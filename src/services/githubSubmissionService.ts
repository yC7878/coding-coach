import mappingsData from "../data/repositoryMappings.json";
import type {
  GithubRepositoryFile,
  GithubSubmission,
  GithubSyncCache,
  GithubSyncError,
  GithubSyncResult,
  ProblemRepositoryMapping,
  RepositoryProblem,
} from "../types/github";
import { analyzeSubmissionHistory } from "./submissionAnalyzer";

export const GITHUB_REPOSITORY = "yC7878/neetcode-submissions";
export const GITHUB_CACHE_STORAGE_KEY = "neetcode-coach-github-cache";
export const GITHUB_SYNC_EVENT = "neetcode-coach-github-sync";
export const GITHUB_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

const mappings = mappingsData as ProblemRepositoryMapping[];
type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
let syncInFlight: Promise<GithubSyncResult> | undefined;

interface GithubContentItem {
  type: "file" | "dir";
  name: string;
  path: string;
  sha?: string;
  content?: string;
  encoding?: string;
}

class GithubServiceError extends Error {
  constructor(readonly kind: GithubSyncError["kind"], message: string) { super(message); }
}

const emptyCache = (): GithubSyncCache => ({
  version: 1,
  repository: GITHUB_REPOSITORY,
  discoveredProblems: [],
  submissions: [],
  analyses: [],
  comparisons: [],
  unmappedRepositorySlugs: [],
});

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");

export function isGithubSyncCache(value: unknown): value is GithubSyncCache {
  return isRecord(value) && value.version === 1 && value.repository === GITHUB_REPOSITORY && Array.isArray(value.discoveredProblems) && Array.isArray(value.submissions) && Array.isArray(value.analyses) && Array.isArray(value.comparisons) && isStringArray(value.unmappedRepositorySlugs);
}

export function getGithubSyncCache(): GithubSyncCache {
  try {
    const raw = window.localStorage.getItem(GITHUB_CACHE_STORAGE_KEY);
    if (!raw) return emptyCache();
    const parsed: unknown = JSON.parse(raw);
    return isGithubSyncCache(parsed) ? parsed : emptyCache();
  } catch {
    return emptyCache();
  }
}

export function setGithubSyncCache(cache: GithubSyncCache): void {
  if (!isGithubSyncCache(cache)) return;
  try {
    window.localStorage.setItem(GITHUB_CACHE_STORAGE_KEY, JSON.stringify(cache));
    window.dispatchEvent(new Event(GITHUB_SYNC_EVENT));
  } catch {
    // The application continues with the in-memory response if storage is unavailable.
  }
}

export function clearGithubSyncCache(): void {
  try {
    window.localStorage.removeItem(GITHUB_CACHE_STORAGE_KEY);
    window.dispatchEvent(new Event(GITHUB_SYNC_EVENT));
  } catch {
    // No action is needed when browser storage is unavailable.
  }
}

export function getLastSyncTime(): string | undefined {
  return getGithubSyncCache().lastSyncAt;
}

export function isGithubCacheStale(cache = getGithubSyncCache(), now = Date.now()): boolean {
  return !cache.lastSyncAt || now - Date.parse(cache.lastSyncAt) >= GITHUB_CACHE_TTL_MS;
}

export function getMappedProblemId(repositorySlug: string): string | undefined {
  return mappings.find((mapping) => mapping.repositorySlug === repositorySlug)?.problemId;
}

const encodePath = (path = "") => path.split("/").map(encodeURIComponent).join("/");
const apiUrl = (path = "") => `https://api.github.com/repos/${GITHUB_REPOSITORY}/contents/${encodePath(path)}`;

async function requestGithub(path: string, fetcher: FetchLike, token?: string): Promise<unknown> {
  let response: Response;
  try {
    response = await fetcher(apiUrl(path), { headers: { Accept: "application/vnd.github+json", ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  } catch {
    throw new GithubServiceError("network", "GitHub is unavailable. Your previously synced submissions are still available.");
  }
  if (response.status === 403 || response.status === 429) throw new GithubServiceError("rate_limit", "GitHub rate limit reached. Try syncing again later.");
  if (response.status === 404) throw new GithubServiceError("repository", `GitHub path was not found: ${path || GITHUB_REPOSITORY}`);
  if (!response.ok) throw new GithubServiceError("network", `GitHub request failed (${response.status}).`);
  try { return await response.json(); } catch { throw new GithubServiceError("malformed_response", "GitHub returned malformed data."); }
}

function asContents(value: unknown): GithubContentItem[] {
  if (!Array.isArray(value) || !value.every((item) => isRecord(item) && (item.type === "file" || item.type === "dir") && typeof item.name === "string" && typeof item.path === "string")) throw new GithubServiceError("malformed_response", "GitHub returned an unexpected repository listing.");
  return value as GithubContentItem[];
}

function languageFor(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  return ({ java: "Java", py: "Python", js: "JavaScript", ts: "TypeScript", cpp: "C++", c: "C", cs: "C#", go: "Go", rs: "Rust", kt: "Kotlin" } as Record<string, string>)[extension ?? ""] ?? "Unknown";
}

function decodeContent(content: string): string {
  try { return atob(content.replace(/\n/g, "")); } catch { throw new GithubServiceError("malformed_response", "A GitHub submission could not be decoded."); }
}

export async function getRepositorySubmissions(fetcher: FetchLike = fetch, token?: string): Promise<RepositoryProblem[]> {
  const root = asContents(await requestGithub("", fetcher, token));
  const categories = root.filter((item) => item.type === "dir");
  const problems = await Promise.all(categories.map(async (category) => {
    const children = asContents(await requestGithub(category.path, fetcher, token));
    const folders = children.filter((item) => item.type === "dir");
    return Promise.all(folders.map(async (folder) => {
      const files = asContents(await requestGithub(folder.path, fetcher, token))
        .filter((item) => item.type === "file")
        .map((item) => ({ name: item.name, path: item.path, ...(item.sha ? { sha: item.sha } : {}), type: "file" as const }));
      return { repositorySlug: folder.name, categoryPath: category.path, files };
    }));
  }));
  return problems.flat();
}

export async function getSubmissionContent(path: string, fetcher: FetchLike = fetch, token?: string): Promise<{ sourceCode: string; commitSha?: string }> {
  const content = await requestGithub(path, fetcher, token);
  if (!isRecord(content) || typeof content.content !== "string" || (content.encoding !== undefined && content.encoding !== "base64")) throw new GithubServiceError("malformed_response", "GitHub returned an invalid submission file.");
  return { sourceCode: decodeContent(content.content), ...(typeof content.sha === "string" ? { commitSha: content.sha } : {}) };
}

export function getProblemSubmissions(repositorySlug: string, cache = getGithubSyncCache()): GithubSubmission[] {
  return cache.submissions.filter((submission) => submission.repositorySlug === repositorySlug);
}

async function performSync(options: { fetcher?: FetchLike; token?: string } = {}): Promise<GithubSyncResult> {
  const fetcher = options.fetcher ?? fetch;
  const previous = getGithubSyncCache();
  try {
    const discoveredProblems = await getRepositorySubmissions(fetcher, options.token);
    const unmappedRepositorySlugs = discoveredProblems.filter((problem) => !getMappedProblemId(problem.repositorySlug)).map((problem) => problem.repositorySlug);
    const mapped = discoveredProblems.filter((problem) => getMappedProblemId(problem.repositorySlug));
    const submissions = (await Promise.all(mapped.flatMap((problem) => problem.files.map(async (file) => {
      const content = await getSubmissionContent(file.path, fetcher, options.token);
      const problemId = getMappedProblemId(problem.repositorySlug)!;
      return {
        id: `${file.sha ?? content.commitSha ?? file.path}`,
        problemId,
        repositorySlug: problem.repositorySlug,
        filename: file.name,
        path: file.path,
        language: languageFor(file.name),
        sourceCode: content.sourceCode,
        ...(content.commitSha ? { commitSha: content.commitSha } : {}),
      } satisfies GithubSubmission;
    })))).sort((a, b) => a.path.localeCompare(b.path));
    const history = analyzeSubmissionHistory(submissions);
    const cache: GithubSyncCache = { version: 1, repository: GITHUB_REPOSITORY, lastSyncAt: new Date().toISOString(), discoveredProblems, submissions, analyses: history.analyses, comparisons: history.comparisons, unmappedRepositorySlugs };
    setGithubSyncCache(cache);
    return { cache, synced: true, usedCache: false };
  } catch (error) {
    const lastError: GithubSyncError = error instanceof GithubServiceError ? { kind: error.kind, message: error.message } : { kind: "unknown", message: "GitHub sync could not be completed." };
    const cache = { ...previous, lastError };
    setGithubSyncCache(cache);
    return { cache, synced: false, usedCache: Boolean(previous.lastSyncAt) };
  }
}

/**
 * One repository walk can issue many requests. Coalesce overlapping calls (including
 * React Strict Mode's development-only double effect) so the public API is not hit twice.
 */
export function syncSubmissions(options: { fetcher?: FetchLike; token?: string } = {}): Promise<GithubSyncResult> {
  if (syncInFlight) return syncInFlight;
  syncInFlight = performSync(options).finally(() => {
    syncInFlight = undefined;
  });
  return syncInFlight;
}

export async function syncIfGithubCacheStale(options: { fetcher?: FetchLike; token?: string } = {}): Promise<GithubSyncResult> {
  const cache = getGithubSyncCache();
  return isGithubCacheStale(cache) ? syncSubmissions(options) : { cache, synced: false, usedCache: true };
}

/** Extracts an optional cached GitHub payload from a version 4 progress export. */
export function parseGithubCacheImport(value: unknown): GithubSyncCache | null {
  return isRecord(value) && isGithubSyncCache(value.githubCache) ? value.githubCache : null;
}
