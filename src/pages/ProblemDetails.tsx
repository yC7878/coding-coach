import { ArrowLeft, Check, ExternalLink, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import problemsData from "../data/problems.json";
import { ProblemStatus } from "../components/problems/ProblemStatus";
import { useProgress } from "../hooks/useProgress";
import type { Problem } from "../types/problem";
import type { ProblemStatus as Status } from "../types/progress";
import { getProblemStatus } from "../utils/progress";

const problems = problemsData as Problem[];

const difficultyStyle = { Easy: "bg-emerald-500/15 text-emerald-300", Medium: "bg-amber-500/15 text-amber-300", Hard: "bg-rose-500/15 text-rose-300" };

export function ProblemDetails() {
  const { id } = useParams();
  const problem = problems.find((item) => item.id === id);
  const { progress, updateProblem } = useProgress();
  const savedProgress = problem ? progress[problem.id] : undefined;
  const [status, setStatus] = useState<Status>(savedProgress?.status ?? "not_started");
  const [confidence, setConfidence] = useState<number | undefined>(savedProgress?.confidence);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStatus(savedProgress?.status ?? "not_started");
    setConfidence(savedProgress?.confidence);
    setSaved(false);
  }, [id, savedProgress?.status, savedProgress?.confidence]);

  if (!problem) return <section className="panel p-8"><h2 className="text-xl font-semibold text-slate-100">Problem not found</h2><p className="mt-2 text-sm text-slate-400">This problem ID does not exist in the local NeetCode 150 dataset.</p><Link to="/problems" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"><ArrowLeft size={16} />Back to problems</Link></section>;

  const save = () => {
    updateProblem(problem.id, { status, confidence, completedAt: status === "completed" ? new Date().toISOString().slice(0, 10) : undefined });
    setSaved(true);
  };
  const currentStatus = getProblemStatus(progress, problem.id);
  return <div className="max-w-3xl"><Link to="/problems" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-100"><ArrowLeft size={16} />All problems</Link><section className="panel mt-5 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${difficultyStyle[problem.difficulty]}`}>{problem.difficulty}</span><ProblemStatus status={currentStatus} /></div><h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">{problem.title}</h2><p className="mt-2 text-sm text-slate-400">{problem.category}</p></div></div><div className="mt-7 border-t border-slate-800 pt-6"><p className="subtle-label">Patterns</p><div className="mt-3 flex flex-wrap gap-2">{problem.patterns.map((pattern) => <span key={pattern} className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-300">{pattern}</span>)}</div></div><div className="mt-7 flex flex-wrap gap-3"><a href={problem.neetcodeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400">Open NeetCode <ExternalLink size={15} /></a>{problem.leetcodeUrl && <a href={problem.leetcodeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800">Open LeetCode <ExternalLink size={15} /></a>}</div></section><section className="panel mt-5 p-5 sm:p-7"><h3 className="text-lg font-semibold text-slate-100">Save progress</h3><fieldset className="mt-5"><legend className="text-sm font-medium text-slate-300">Status</legend><div className="mt-3 flex flex-wrap gap-2">{(["not_started", "completed"] as Status[]).map((value) => <button key={value} type="button" onClick={() => setStatus(value)} className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${status === value ? "border-blue-400 bg-blue-500/15 text-blue-200" : "border-slate-700 text-slate-400 hover:border-slate-600"}`}>{value === "completed" ? "● Completed" : "○ Not Started"}</button>)}</div></fieldset><fieldset className="mt-6"><legend className="text-sm font-medium text-slate-300">Confidence <span className="font-normal text-slate-500">(optional)</span></legend><div className="mt-3 flex gap-2">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`Confidence ${value} of 5`} onClick={() => setConfidence(confidence === value ? undefined : value)} className={`h-10 w-10 rounded-lg border text-sm font-semibold transition ${confidence === value ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-slate-700 text-slate-400 hover:border-cyan-500"}`}>{value}</button>)}</div></fieldset><div className="mt-7 flex items-center gap-3"><button onClick={save} type="button" className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"><Save size={16} />Save Progress</button>{saved && <span className="inline-flex items-center gap-1.5 text-sm text-emerald-300"><Check size={16} />Saved to this browser</span>}</div></section></div>;
}
