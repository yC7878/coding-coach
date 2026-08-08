import type { Problem } from "../../types/problem";
import type { ProgressMap } from "../../types/progress";
import { getProblemStatus } from "../../utils/progress";
import { ProblemCard } from "./ProblemCard";

interface ProblemListProps {
  problems: Problem[];
  progress: ProgressMap;
}

export function ProblemList({ problems, progress }: ProblemListProps) {
  if (problems.length === 0) {
    return <div className="panel px-6 py-14 text-center text-sm text-slate-400">No problems match these filters.</div>;
  }
  return <div className="space-y-2">{problems.map((problem) => <ProblemCard key={problem.id} problem={problem} status={getProblemStatus(progress, problem.id)} />)}</div>;
}
