import { CheckCircle2, Pause, Play, Square } from "lucide-react";
import { useState } from "react";
import { useProgress } from "../../hooks/useProgress";
import type { Problem } from "../../types/problem";
import { FinishSessionModal } from "./FinishSessionModal";
import { SessionTimer } from "./SessionTimer";
import { StartProblemButton } from "./StartProblemButton";

export function StudyControls({ problem, className = "", startLabel = "Start Problem" }: { problem: Problem; className?: string; startLabel?: string }) {
  const { activeSession, pauseSession, resumeSession } = useProgress();
  const [finishOpen, setFinishOpen] = useState(false);
  const isCurrent = activeSession?.problemId === problem.id;
  if (!isCurrent) return <StartProblemButton problem={problem} label={startLabel} className={className} />;
  return <div className="flex flex-wrap items-center gap-3"><SessionTimer session={activeSession} /><button type="button" onClick={activeSession.isPaused ? resumeSession : pauseSession} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3.5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-400 hover:bg-slate-800">{activeSession.isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}{activeSession.isPaused ? "Resume" : "Pause"}</button><button type="button" onClick={() => setFinishOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3.5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"><Square size={15} fill="currentColor" />Finish</button>{finishOpen && <FinishSessionModal session={activeSession} onClose={() => setFinishOpen(false)} />}</div>;
}
