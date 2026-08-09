import { Braces, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import syntaxData from "../../data/syntax.json";
import type { SyntaxReference } from "../../types/syntax";
import type { SyntaxMistakeStat } from "../../utils/progress";

const syntaxReferences = syntaxData as SyntaxReference[];

export function SyntaxRecallInsight({ mistakes, affectedApis }: { mistakes: SyntaxMistakeStat[]; affectedApis: number }) {
  const items = mistakes.flatMap((stat) => {
    const syntax = syntaxReferences.find((item) => item.id === stat.syntaxId);
    return syntax ? [{ ...stat, label: syntax.label }] : [];
  });
  if (items.length === 0) return null;
  return <section className="panel border-violet-400/20 bg-violet-500/[0.04] p-5"><div className="flex items-center gap-2 text-violet-200"><Braces size={17} /><span className="subtle-label !text-violet-200">Syntax recall</span></div><h2 className="mt-2 text-lg font-semibold text-slate-100">You have {affectedApis} {affectedApis === 1 ? "API" : "APIs"} to practice.</h2><div className="mt-4 space-y-2">{items.map((item) => <div key={item.syntaxId} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950/30 px-3 py-2 text-sm"><span className="font-medium text-slate-200">{item.label}</span><span className="shrink-0 text-violet-200">{item.count} {item.count === 1 ? "mistake" : "mistakes"}</span></div>)}</div><Link to="/syntax" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-200 hover:text-violet-100">Practice Recall <ArrowRight size={15} /></Link></section>;
}
