import { useCallback, useEffect, useState } from "react";
import { GITHUB_SYNC_EVENT, getGithubSyncCache, syncSubmissions } from "../services/githubSubmissionService";
import type { GithubSyncCache, GithubSyncResult } from "../types/github";

export function useGithubSync() {
  const [cache, setCache] = useState<GithubSyncCache>(() => getGithubSyncCache());
  const [syncing, setSyncing] = useState(false);
  useEffect(() => {
    const update = () => setCache(getGithubSyncCache());
    window.addEventListener(GITHUB_SYNC_EVENT, update);
    return () => window.removeEventListener(GITHUB_SYNC_EVENT, update);
  }, []);
  const sync = useCallback(async (): Promise<GithubSyncResult> => {
    setSyncing(true);
    const result = await syncSubmissions();
    setCache(result.cache);
    setSyncing(false);
    return result;
  }, []);
  return { cache, syncing, sync };
}
