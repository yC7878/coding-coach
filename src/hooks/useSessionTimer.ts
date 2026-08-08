import { useEffect, useState } from "react";
import type { ActiveStudySession } from "../types/progress";
import { getActiveSessionDuration } from "../services/progressService";

/** Re-renders the display, while the duration itself is always timestamp-derived. */
export function useSessionTimer(session: ActiveStudySession | null): number {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setNow(new Date());
    if (!session || session.isPaused) return undefined;
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, [session?.id, session?.isPaused, session?.activeSegmentStartedAt]);

  return session ? getActiveSessionDuration(session, now) : 0;
}
