import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { StudyControls } from "../components/study/StudyControls";
import problemsData from "../data/problems.json";
import { ProblemStatus } from "../components/problems/ProblemStatus";
import { useProgress } from "../hooks/useProgress";
import type { Problem } from "../types/problem";
import { formatDuration, formatSessionResult, getLatestCompletedSession, getProblemStatus } from "../utils/progress";

const problems = problemsData as Problem[];
const difficultyStyle = { Easy: "bg-emerald-500/15 text-emerald-300", Medium: "bg-amber-500/15 text-amber-300", Hard: "bg-rose-500/15 text-rose-300" };

export function ProblemDetails() {
  const { id } = useParams();
  const problem = problems.find((item) => item.id === id);
  const { progress } = useProgress();
  if (!problem) return <section className="panel p-8"><h2 className="text-xl font-semibold text-slate-100">Problem not found</h2><p className="mt-2 text-sm text-slate-400">This problem ID does not exist in the local NeetCode 150 dataset.</p><Link to="/problems" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"><ArrowLeft size={16} />Back to problems</Link></section>;
  const current = progress[problem.id];
  const status = getProblemStatus(progress, problem.id);
  const latestSession = getLatestCompletedSession(current);
  return <div className="max-w-3xl"><Link to="/problems" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-100"><ArrowLeft size={16} />All problems</Link><section className="panel mt-5 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${difficultyStyle[problem.difficulty]}`}>{problem.difficulty}</span><ProblemStatus status={status} /></div><h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">{problem.title}</h2><p className="mt-2 text-sm text-slate-400">{problem.category}</p></div></div><div className="mt-7 border-t border-slate-800 pt-6"><p className="subtle-label">Patterns</p><div className="mt-3 flex flex-wrap gap-2">{problem.patterns.map((pattern) => <span key={pattern} className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-300">{pattern}</span>)}</div></div><div className="mt-7 flex flex-wrap gap-3"><a href={problem.neetcodeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400">Open NeetCode <ExternalLink size={15} /></a>{problem.leetcodeUrl && <a href={problem.leetcodeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800">Open LeetCode <ExternalLink size={15} /></a>}</div></section><section className="panel mt-5 p-5 sm:p-7"><p className="subtle-label">Study workflow</p><h3 className="mt-1 text-lg font-semibold text-slate-100">{status === "completed" ? "Practice this problem again" : status === "in_progress" ? "Your session is in progress" : "Ready when you are"}</h3>{status === "completed" && latestSession && <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4"><div className="flex items-center gap-2 text-emerald-300"><CheckCircle2 size={17} /><span className="text-sm font-semibold">Completed</span></div><p className="mt-2 text-sm text-slate-300">Last attempt: {formatDuration(latestSession.durationSeconds)} · {formatSessionResult(latestSession.result)}{latestSession.confidence ? ` · Confidence ${latestSession.confidence}/5` : ""}</p></div>}<div className="mt-6"><StudyControls problem={problem} startLabel={status === "completed" ? "Practice Again" : "Start Problem"} /></div>{current && current.sessions.length > 1 && <p className="mt-5 text-xs text-slate-500">{current.sessions.length} study sessions saved for this problem.</p>}</section></div>;
}
