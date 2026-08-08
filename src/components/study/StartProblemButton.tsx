import { Play, TimerReset, X } from "lucide-react";
import { useMemo, useState } from "react";
import problemsData from "../../data/problems.json";
import { useProgress } from "../../hooks/useProgress";
import type { Problem } from "../../types/problem";

const problems = problemsData as Problem[];

interface StartProblemButtonProps {
  problem: Problem;
  label?: string;
  className?: string;
}

export function StartProblemButton({ problem, label = "Start Problem", className = "" }: StartProblemButtonProps) {
  const { activeSession, startSession, replaceActiveSession } = useProgress();
  const [showConflict, setShowConflict] = useState(false);
  const activeProblem = useMemo(() => problems.find((item) => item.id === activeSession?.problemId), [activeSession?.problemId]);
  const start = () => {
    const result = startSession(problem.id);
    if (result.type === "conflict") setShowConflict(true);
  };
  const startNew = () => {
    replaceActiveSession(problem.id);
    setShowConflict(false);
  };
  const primaryClass = className || "inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-3.5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200";
  return <><button type="button" onClick={start} className={primaryClass}><Play size={16} fill="currentColor" />{label}</button>{showConflict && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="session-conflict-title"><div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="subtle-label">Active study session</p><h2 id="session-conflict-title" className="mt-1 text-xl font-semibold text-slate-50">Start a different problem?</h2></div><button type="button" aria-label="Close" onClick={() => setShowConflict(false)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800"><X size={18} /></button></div><p className="mt-4 text-sm leading-6 text-slate-400">You’re currently working on <span className="font-medium text-slate-100">{activeProblem?.title ?? "another problem"}</span>. Starting this problem will stop that timer and preserve its elapsed time as an unfinished session.</p><div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setShowConflict(false)} className="rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">Cancel</button><button type="button" onClick={startNew} className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-3.5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200"><TimerReset size={16} />Start New Problem</button></div></div></div>}</>;
}
