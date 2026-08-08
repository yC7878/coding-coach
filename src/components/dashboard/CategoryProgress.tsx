import type { CategoryStats } from "../../utils/progress";
import { ProgressBar } from "../ui/ProgressBar";

export function CategoryProgress({ stats }: { stats: CategoryStats[] }) {
  return <section className="panel p-5"><div><p className="subtle-label">Momentum by topic</p><h2 className="mt-1 text-lg font-semibold text-slate-100">Category progress</h2></div><div className="mt-5 space-y-4">{stats.map((category) => <div key={category.category}><div className="mb-2 flex justify-between gap-4 text-sm"><span className="font-medium text-slate-300">{category.category}</span><span className="shrink-0 text-slate-500">{category.completed} / {category.total}</span></div><ProgressBar value={category.percentage} /></div>)}</div></section>;
}
