import { Clock3, Sparkles } from "lucide-react";
import { StudyControls } from "../study/StudyControls";
import type { Recommendation } from "../../utils/recommendation";

const difficultyClass = { Easy: "text-emerald-200", Medium: "text-amber-200", Hard: "text-rose-200" };

export function TodayRecommendation({ recommendation }: { recommendation?: Recommendation }) {
  return <section className="overflow-hidden rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-blue-500/20 via-slate-900 to-cyan-500/15 p-5 shadow-panel sm:p-6"><div className="flex items-center gap-2 text-cyan-200"><Sparkles size={17} /><span className="subtle-label !text-cyan-200">Today’s recommendation</span></div>{recommendation ? <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end"><div><h2 className="text-2xl font-semibold tracking-tight text-white">{recommendation.problem.title}</h2><div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-300"><span>{recommendation.problem.category}</span><span aria-hidden>·</span><span className={difficultyClass[recommendation.problem.difficulty]}>{recommendation.problem.difficulty}</span><span aria-hidden>·</span><span>{recommendation.problem.patterns.join(" · ")}</span></div><p className="mt-4 max-w-2xl text-sm text-slate-300">{recommendation.reason}</p><p className="mt-2 inline-flex items-center gap-1.5 text-sm text-cyan-100"><Clock3 size={15} />Estimated time: about {recommendation.estimatedMinutes} min</p></div><StudyControls problem={recommendation.problem} /></div> : <><h2 className="mt-4 text-xl font-semibold text-white">You’ve completed the list.</h2><p className="mt-2 text-sm text-slate-300">Great work. Phase 2 will add review scheduling next.</p></>}</section>;
}
