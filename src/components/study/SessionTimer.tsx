import { PauseCircle, Timer } from "lucide-react";
import { useSessionTimer } from "../../hooks/useSessionTimer";
import type { ActiveStudySession } from "../../types/progress";
import { formatTimer } from "../../utils/progress";

export function SessionTimer({ session, showState = true, className = "" }: { session: ActiveStudySession; showState?: boolean; className?: string }) {
  const elapsed = useSessionTimer(session);
  const Icon = session.isPaused ? PauseCircle : Timer;
  return <span className={`inline-flex items-center gap-2 font-mono text-sm font-semibold tabular-nums ${session.isPaused ? "text-amber-300" : "text-cyan-200"} ${className}`}><Icon size={16} />{showState && <span className="font-sans text-xs font-medium uppercase tracking-wide">{session.isPaused ? "Paused" : "In Progress"}</span>} {formatTimer(elapsed)}</span>;
}
