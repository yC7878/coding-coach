import { ChevronRight, Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { SessionTimer } from "../study/SessionTimer";
import { StartProblemButton } from "../study/StartProblemButton";
import { useProgress } from "../../hooks/useProgress";
import type { Problem } from "../../types/problem";
import type { ProblemStatus as Status } from "../../types/progress";
import { formatDuration, getLatestCompletedSession } from "../../utils/progress";
import { ProblemStatus } from "./ProblemStatus";

interface ProblemCardProps {
  problem: Problem;
  status: Status;
}

const difficultyStyle = { Easy: "text-emerald-300", Medium: "text-amber-300", Hard: "text-rose-300" };

export function ProblemCard({ problem, status }: ProblemCardProps) {
  const { progress, activeSession } = useProgress();
  const completed = status === "completed";
  const isActive = activeSession?.problemId === problem.id;
  const latestSession = getLatestCompletedSession(progress[problem.id]);
  return <article className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition ${completed ? "border-emerald-500/20 bg-emerald-500/[0.04]" : isActive ? "border-cyan-400/30 bg-cyan-400/[0.04]" : "border-slate-800 bg-slate-900/55 hover:border-slate-700"}`}><Link to={`/problems/${problem.id}`} className="min-w-0 flex-1"><h3 className={`truncate font-medium ${completed ? "text-slate-300" : "text-slate-100"}`}>{problem.title}</h3><div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500"><span>{problem.category}</span><span aria-hidden>·</span><span className={difficultyStyle[problem.difficulty]}>{problem.difficulty}</span><span aria-hidden>·</span><span>{problem.patterns.join(" · ")}</span></div></Link><div className="min-w-[76px] sm:min-w-[108px]">{isActive ? <div><SessionTimer session={activeSession} showState={false} /><Link to={`/problems/${problem.id}`} className="mt-1 flex items-center gap-1 text-xs font-medium text-cyan-300 hover:text-cyan-200"><Clock3 size={12} />Continue</Link></div> : completed ? <div><ProblemStatus status={status} />{latestSession && <p className="mt-1 text-xs text-slate-500">{formatDuration(latestSession.durationSeconds)}</p>}</div> : <StartProblemButton problem={problem} label="Start" className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200" />}</div><ChevronRight className="shrink-0 text-slate-600 transition group-hover:text-slate-300" size={18} /></article>;
}
