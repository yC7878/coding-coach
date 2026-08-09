import { ArrowLeft, CheckCircle2, ExternalLink, Pencil } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EditPerformanceModal } from "../components/problems/EditPerformanceModal";
import { GithubSubmissions } from "../components/problems/GithubSubmissions";
import { StudyControls } from "../components/study/StudyControls";
import problemsData from "../data/problems.json";
import syntaxData from "../data/syntax.json";
import { ProblemStatus } from "../components/problems/ProblemStatus";
import { useProgress } from "../hooks/useProgress";
import { getEffectivePerformanceDetails } from "../services/performanceService";
import type { Problem } from "../types/problem";
import type { SyntaxMistake } from "../types/progress";
import type { DetectedSyntaxIssue } from "../types/performance";
import type { SyntaxReference } from "../types/syntax";
import { formatDuration, formatSessionResult, getLatestCompletedSession, getProblemStatus, getProblemSyntaxMistakes } from "../utils/progress";

const problems = problemsData as Problem[];
const syntaxReferences = syntaxData as SyntaxReference[];
const difficultyStyle = { Easy: "bg-emerald-500/15 text-emerald-300", Medium: "bg-amber-500/15 text-amber-300", Hard: "bg-rose-500/15 text-rose-300" };
const confidenceStars = (confidence?: number) => confidence ? "★".repeat(confidence) + "☆".repeat(5 - confidence) : "Not recorded";
const sourceLabel = (source?: string) => source === "user_override" ? "User override" : source === "analysis" ? "Analysis" : source === "github" ? "GitHub" : source === "user" ? "Study session" : "Not recorded";

export function ProblemDetails() {
  const { id } = useParams();
  const problem = problems.find((item) => item.id === id);
  const { progress } = useProgress();
  const [editingPerformance, setEditingPerformance] = useState(false);
  const [reviewSyntaxMistakes, setReviewSyntaxMistakes] = useState<SyntaxMistake[]>();
  if (!problem) return <section className="panel p-8"><h2 className="text-xl font-semibold text-slate-100">Problem not found</h2><p className="mt-2 text-sm text-slate-400">This problem ID does not exist in the local NeetCode 150 dataset.</p><Link to="/problems" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-blue-300 hover:text-blue-200"><ArrowLeft size={16} />Back to problems</Link></section>;

  const current = progress[problem.id];
  const status = getProblemStatus(progress, problem.id);
  const latestSession = getLatestCompletedSession(current);
  const effective = getEffectivePerformanceDetails(current);
  const historicalSyntaxMistakes = getProblemSyntaxMistakes(progress, problem.id);
  const displayedSyntaxMistakes = effective.syntaxIssues?.value ?? historicalSyntaxMistakes;
  const syntaxIds = [...new Set(displayedSyntaxMistakes.map((mistake) => mistake.syntaxId))];
  const syntaxLabels = syntaxIds.map((syntaxId) => syntaxReferences.find((item) => item.id === syntaxId)?.label ?? syntaxId);
  const hasPerformance = status === "completed" || Boolean(current?.performance);

  const reviewDetectedIssue = (issue: DetectedSyntaxIssue) => {
    setReviewSyntaxMistakes([{ syntaxId: issue.syntaxId, entered: issue.incorrectText, expected: issue.correctedText }]);
    setEditingPerformance(true);
  };

  return <div className="max-w-3xl"><Link to="/problems" className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-100"><ArrowLeft size={16} />All problems</Link><section className="panel mt-5 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${difficultyStyle[problem.difficulty]}`}>{problem.difficulty}</span><ProblemStatus status={status} /></div><h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-50 sm:text-3xl">{problem.title}</h2><p className="mt-2 text-sm text-slate-400">{problem.category}</p></div></div><div className="mt-7 border-t border-slate-800 pt-6"><p className="subtle-label">Patterns</p><div className="mt-3 flex flex-wrap gap-2">{problem.patterns.map((pattern) => <span key={pattern} className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-300">{pattern}</span>)}</div></div><div className="mt-7 flex flex-wrap gap-3"><a href={problem.neetcodeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400">Open NeetCode <ExternalLink size={15} /></a>{problem.leetcodeUrl && <a href={problem.leetcodeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3.5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800">Open LeetCode <ExternalLink size={15} /></a>}</div></section><section className="panel mt-5 p-5 sm:p-7"><p className="subtle-label">Study workflow</p><h3 className="mt-1 text-lg font-semibold text-slate-100">{status === "completed" ? "Practice this problem again" : status === "in_progress" ? "Your session is in progress" : "Ready when you are"}</h3>{status === "completed" && latestSession && <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4"><div className="flex items-center gap-2 text-emerald-300"><CheckCircle2 size={17} /><span className="text-sm font-semibold">Completed</span></div><p className="mt-2 text-sm text-slate-300">Last attempt: {formatDuration(latestSession.durationSeconds)} · {formatSessionResult(latestSession.result)}{latestSession.confidence ? ` · Confidence ${latestSession.confidence}/5` : ""}</p></div>}<div className="mt-6"><StudyControls problem={problem} startLabel={status === "completed" ? "Practice Again" : "Start Problem"} /></div>{current && current.sessions.length > 1 && <p className="mt-5 text-xs text-slate-500">{current.sessions.length} study sessions saved for this problem.</p>}</section>{hasPerformance && <section className="panel mt-5 p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="subtle-label">Performance details</p><h3 className="mt-1 text-lg font-semibold text-slate-100">Editable performance record</h3></div><button type="button" onClick={() => { setReviewSyntaxMistakes(undefined); setEditingPerformance(true); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-100"><Pencil size={15} />Edit</button></div><div className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><div className="rounded-xl bg-slate-950/30 p-3"><p className="text-slate-500">Solve time</p><p className="mt-1 font-medium text-slate-200">{effective.solveTimeSeconds ? formatDuration(effective.solveTimeSeconds.value) : "Not recorded"}</p><p className="mt-1 text-xs text-slate-600">{sourceLabel(effective.solveTimeSeconds?.source)}</p></div><div className="rounded-xl bg-slate-950/30 p-3"><p className="text-slate-500">Result</p><p className="mt-1 font-medium text-slate-200">{effective.result ? formatSessionResult(effective.result.value) : "Not recorded"}</p><p className="mt-1 text-xs text-slate-600">{sourceLabel(effective.result?.source)}</p></div><div className="rounded-xl bg-slate-950/30 p-3"><p className="text-slate-500">Confidence</p><p className="mt-1 tracking-wide text-amber-200">{confidenceStars(effective.confidence?.value)}</p><p className="mt-1 text-xs text-slate-600">{sourceLabel(effective.confidence?.source)}</p></div><div className="rounded-xl bg-slate-950/30 p-3"><p className="text-slate-500">Algorithm understanding</p><p className="mt-1 font-medium capitalize text-slate-200">{effective.algorithmUnderstanding?.value?.replace("_", " ") ?? "Not classified"}</p><p className="mt-1 text-xs text-slate-600">{sourceLabel(effective.algorithmUnderstanding?.source)}</p></div><div className="rounded-xl bg-slate-950/30 p-3"><p className="text-slate-500">Pattern</p><p className="mt-1 font-medium text-slate-200">{effective.pattern?.value ?? problem.patterns.join(" · ")}</p><p className="mt-1 text-xs text-slate-600">{sourceLabel(effective.pattern?.source)}</p></div><div className="rounded-xl bg-slate-950/30 p-3"><p className="text-slate-500">Notes</p><p className="mt-1 text-slate-200">{effective.notes?.value ?? "None"}</p><p className="mt-1 text-xs text-slate-600">{sourceLabel(effective.notes?.source)}</p></div></div>{displayedSyntaxMistakes.length > 0 && <div className="mt-6"><p className="text-sm font-medium text-slate-200">Syntax/API Issues <span className="ml-1 text-xs font-normal text-slate-500">{sourceLabel(effective.syntaxIssues?.source)}</span></p><ul className="mt-2 space-y-1.5">{syntaxLabels.map((label) => <li key={label} className="text-sm text-slate-400">• {label}</li>)}</ul><Link to={`/syntax?focus=${syntaxIds.join(",")}`} className="mt-4 inline-flex rounded-lg border border-violet-400/40 px-3.5 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/10">Practice These</Link></div>}</section>}<GithubSubmissions problemId={problem.id} onReviewSyntaxIssue={reviewDetectedIssue} />{editingPerformance && <EditPerformanceModal problem={problem} initialSyntaxMistakes={reviewSyntaxMistakes} onClose={() => { setEditingPerformance(false); setReviewSyntaxMistakes(undefined); }} />}</div>;
}
