import { beforeEach, describe, expect, it } from "vitest";
import {
  GITHUB_CACHE_TTL_MS,
  clearGithubSyncCache,
  getGithubSyncCache,
  getMappedProblemId,
  getProblemSubmissions,
  getRepositorySubmissions,
  isGithubCacheStale,
  setGithubSyncCache,
  syncIfGithubCacheStale,
  syncSubmissions,
} from "./githubSubmissionService";
import type { GithubSyncCache } from "../types/github";

const response = (body: unknown, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;
const category = "Data Structures & Algorithms";
const folder = `${category}/is-anagram`;
const sourceCode = "return Arrays.equals(a, b);";

const repositoryFetcher = async (input: RequestInfo | URL): Promise<Response> => {
  const url = typeof input === "string" ? input : input.toString();
  const path = decodeURIComponent(url.split("/contents/")[1] ?? "");
  if (path === "") return response([{ type: "dir", name: category, path: category }]);
  if (path === category) return response([{ type: "dir", name: "is-anagram", path: folder }, { type: "dir", name: "unmapped", path: `${category}/unmapped` }]);
  if (path === folder) return response([{ type: "file", name: "submission-0.java", path: `${folder}/submission-0.java`, sha: "listing-sha" }]);
  if (path === `${folder}/submission-0.java`) return response({ content: btoa(sourceCode), encoding: "base64", sha: "content-sha" });
  if (path === `${category}/unmapped`) return response([]);
  return response({ message: "Not found" }, 404);
};

const cached = (lastSyncAt?: string): GithubSyncCache => ({
  version: 1,
  repository: "yC7878/neetcode-submissions",
  ...(lastSyncAt ? { lastSyncAt } : {}),
  discoveredProblems: [],
  submissions: [],
  analyses: [],
  comparisons: [],
  unmappedRepositorySlugs: [],
});

describe("GitHub submission service", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearGithubSyncCache();
  });

  it("parses repository folders and uses explicit repository mappings", async () => {
    const discovered = await getRepositorySubmissions(repositoryFetcher);
    expect(discovered).toEqual(expect.arrayContaining([expect.objectContaining({ repositorySlug: "is-anagram", files: [expect.objectContaining({ name: "submission-0.java" })] })]));
    expect(getMappedProblemId("is-anagram")).toBe("valid-anagram");
    expect(getMappedProblemId("unmapped")).toBeUndefined();
  });

  it("syncs mapped submission history, preserves unmapped folders, and serves the cache", async () => {
    const result = await syncSubmissions({ fetcher: repositoryFetcher });
    expect(result).toMatchObject({ synced: true, usedCache: false });
    expect(result.cache.submissions).toEqual([expect.objectContaining({ problemId: "valid-anagram", sourceCode, language: "Java" })]);
    expect(result.cache.unmappedRepositorySlugs).toEqual(["unmapped"]);
    expect(getProblemSubmissions("is-anagram")).toHaveLength(1);
  });

  it("keeps previously cached data when GitHub is unavailable", async () => {
    const previous = { ...cached("2026-08-08T20:00:00.000Z"), submissions: [{ id: "cached", problemId: "two-sum", repositorySlug: "two-integer-sum", filename: "submission-0.java", path: "cached.java", language: "Java", sourceCode: "return;" }] };
    setGithubSyncCache(previous);
    const result = await syncSubmissions({ fetcher: async () => { throw new Error("offline"); } });
    expect(result).toMatchObject({ synced: false, usedCache: true, cache: { submissions: [expect.objectContaining({ id: "cached" })], lastError: { kind: "network" } } });
  });

  it("handles malformed responses and honors a fresh cache TTL", async () => {
    const malformed = await syncSubmissions({ fetcher: async () => response({ not: "a listing" }) });
    expect(malformed.cache.lastError?.kind).toBe("malformed_response");

    const fresh = cached(new Date().toISOString());
    setGithubSyncCache(fresh);
    expect(isGithubCacheStale(fresh)).toBe(false);
    expect(isGithubCacheStale(cached(new Date(Date.now() - GITHUB_CACHE_TTL_MS - 1).toISOString()))).toBe(true);
    await expect(syncIfGithubCacheStale({ fetcher: async () => { throw new Error("should not fetch"); } })).resolves.toMatchObject({ usedCache: true, synced: false });
    expect(getGithubSyncCache()).toEqual(fresh);
  });
});
