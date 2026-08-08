import { CheckCircle2 } from "lucide-react";
import type { RecentProblem } from "../../utils/progress";
import { formatCompletionDate, formatDuration, formatSessionResult } from "../../utils/progress";

export function RecentProblems({ problems }: { problems: RecentProblem[] }) {
  return <section className="panel p-5"><p className="subtle-label">Keep building</p><h2 className="mt-1 text-lg font-semibold text-slate-100">Recent activity</h2>{problems.length === 0 ? <div className="mt-6 rounded-xl border border-dashed border-slate-700 px-4 py-7 text-center text-sm text-slate-400">Completed study sessions will appear here.</div> : <div className="mt-4 space-y-1">{problems.map(({ problem, progress, session }) => <div key={problem.id} className="flex gap-3 rounded-xl px-2 py-3"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={18} /><div><p className="font-medium text-slate-200">{problem.title}</p><p className="mt-1 text-xs text-slate-500">{problem.category} · {problem.difficulty}</p>{session && <p className="mt-1 text-xs text-slate-300">{formatDuration(session.durationSeconds)} · {formatSessionResult(session.result)}</p>}<p className="mt-1 text-xs text-slate-400">{formatCompletionDate(session?.endedAt?.slice(0, 10) ?? progress.completedAt)}</p></div></div>)}</div>}</section>;
}
