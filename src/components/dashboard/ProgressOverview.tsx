import { CheckCircle2, CircleDashed, ListTodo, Trophy } from "lucide-react";
import type { OverallProgress } from "../../utils/progress";
import { ProgressBar } from "../ui/ProgressBar";

export function ProgressOverview({ stats }: { stats: OverallProgress }) {
  const cards = [
    { label: "Total Problems", value: stats.total, Icon: ListTodo, tone: "text-blue-300 bg-blue-500/10" },
    { label: "Completed", value: stats.completed, Icon: CheckCircle2, tone: "text-emerald-300 bg-emerald-500/10" },
    { label: "Remaining", value: stats.remaining, Icon: CircleDashed, tone: "text-amber-300 bg-amber-500/10" },
    { label: "Overall Progress", value: `${stats.percentage}%`, Icon: Trophy, tone: "text-violet-300 bg-violet-500/10" },
  ];
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, Icon, tone }) => <div key={label} className="panel p-5"><div className="flex items-center justify-between"><span className="text-sm text-slate-400">{label}</span><span className={`rounded-lg p-2 ${tone}`}><Icon size={18} /></span></div><p className="mt-5 text-3xl font-semibold tracking-tight text-slate-50">{value}</p></div>)}
      <div className="panel p-5 sm:col-span-2 xl:col-span-4"><div className="flex items-baseline justify-between"><div><p className="font-medium text-slate-100">Your NeetCode 150 progress</p><p className="mt-1 text-sm text-slate-400">{stats.completed} of {stats.total} problems completed</p></div><span className="text-lg font-semibold text-cyan-300">{stats.percentage}%</span></div><ProgressBar value={stats.percentage} className="mt-4" /></div>
    </section>
  );
}
