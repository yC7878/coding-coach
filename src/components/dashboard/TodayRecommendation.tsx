import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import type { Problem } from "../../types/problem";

export function TodayRecommendation({ problem }: { problem?: Problem }) {
  return <section className="overflow-hidden rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/15 via-slate-900 to-cyan-500/10 p-5 shadow-panel"><div className="flex items-center gap-2 text-cyan-200"><Sparkles size={17} /><span className="subtle-label !text-cyan-200">Today’s recommendation</span></div>{problem ? <><h2 className="mt-4 text-xl font-semibold text-white">{problem.title}</h2><p className="mt-2 text-sm text-slate-300">Start with {problem.category} and practice the {problem.patterns.join(" · ")} pattern.</p><Link to={`/problems/${problem.id}`} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-3.5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200">Open problem <ArrowRight size={16} /></Link></> : <><h2 className="mt-4 text-xl font-semibold text-white">You’ve completed the list.</h2><p className="mt-2 text-sm text-slate-300">Great work. Phase 2 will add review scheduling next.</p></>}</section>;
}
