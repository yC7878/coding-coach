import { Check, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Problem } from "../../types/problem";
import type { ProblemStatus as Status } from "../../types/progress";
import { ProblemStatus } from "./ProblemStatus";

interface ProblemCardProps {
  problem: Problem;
  status: Status;
  onToggle: (problemId: string) => void;
}

const difficultyStyle = {
  Easy: "text-emerald-300",
  Medium: "text-amber-300",
  Hard: "text-rose-300",
};

export function ProblemCard({ problem, status, onToggle }: ProblemCardProps) {
  const completed = status === "completed";
  return (
    <article className={`group flex items-center gap-3 rounded-xl border px-4 py-3 transition ${completed ? "border-emerald-500/20 bg-emerald-500/[0.04]" : "border-slate-800 bg-slate-900/55 hover:border-slate-700"}`}>
      <button
        type="button"
        aria-label={`${completed ? "Mark" : "Mark as"} ${problem.title} ${completed ? "not started" : "completed"}`}
        onClick={() => onToggle(problem.id)}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition ${completed ? "border-emerald-400 bg-emerald-400 text-slate-950" : "border-slate-600 text-transparent hover:border-blue-400"}`}
      >
        <Check size={16} strokeWidth={3} />
      </button>
      <Link to={`/problems/${problem.id}`} className="min-w-0 flex-1">
        <h3 className={`truncate font-medium ${completed ? "text-slate-400 line-through" : "text-slate-100"}`}>{problem.title}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
          <span>{problem.category}</span><span aria-hidden>·</span>
          <span className={difficultyStyle[problem.difficulty]}>{problem.difficulty}</span><span aria-hidden>·</span>
          <span>{problem.patterns.join(" · ")}</span>
        </div>
      </Link>
      <div className="hidden sm:block"><ProblemStatus status={status} /></div>
      <ChevronRight className="shrink-0 text-slate-600 transition group-hover:text-slate-300" size={18} />
    </article>
  );
}
