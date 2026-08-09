import { Braces, ListChecks } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SyntaxPractice } from "../components/syntax/SyntaxPractice";
import syntaxData from "../data/syntax.json";
import { useProgress } from "../hooks/useProgress";
import type { SyntaxReference } from "../types/syntax";
import { getSyntaxStats } from "../utils/progress";
import { getSyntaxPracticeQueue } from "../utils/syntax";

const syntaxReferences = syntaxData as SyntaxReference[];

export function SyntaxRecall() {
  const { progress } = useProgress();
  const [searchParams] = useSearchParams();
  const focusIds = searchParams.get("focus")?.split(",").filter(Boolean) ?? [];
  const stats = useMemo(() => getSyntaxStats(progress), [progress]);
  const queue = useMemo(() => getSyntaxPracticeQueue(syntaxReferences, progress, focusIds), [focusIds.join(","), progress]);
  if (queue.length === 0) return <section className="panel max-w-2xl p-6 text-center sm:p-10"><Braces className="mx-auto text-violet-300" size={32} /><h2 className="mt-4 text-xl font-semibold text-slate-100">No syntax mistakes recorded yet.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">Complete some problems and record your syntax mistakes to start building your personalized practice list.</p></section>;
  return <div className="space-y-6"><section className="panel p-5 sm:p-6"><p className="subtle-label">Your Java review queue</p><h2 className="mt-1 text-xl font-semibold text-slate-100">APIs you need to practice</h2><p className="mt-2 text-sm text-slate-400">Frequency-first for now: APIs with more recorded mistakes appear first.</p><div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{queue.map(({ syntax, mistakes }) => <Link key={syntax.id} to={`/syntax?focus=${syntax.id}#practice`} className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 transition hover:border-violet-400/50"><p className="font-medium text-slate-200">{syntax.label}</p><p className="mt-1 text-sm text-violet-200">{mistakes} {mistakes === 1 ? "mistake" : "mistakes"}</p></Link>)}</div><p className="mt-4 text-xs text-slate-500">{stats.totalMistakes} exact syntax mistakes across {stats.affectedApis} APIs.</p></section><div id="practice"><SyntaxPractice queue={queue} initialSyntaxId={focusIds[0]} /></div><section className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400"><ListChecks className="mt-0.5 shrink-0 text-slate-500" size={18} />Practice checks answers immediately. This Phase 1 queue uses recorded frequency only; it does not infer algorithm weakness from syntax recall mistakes.</section></div>;
}
