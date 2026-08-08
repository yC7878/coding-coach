import { CheckCircle2, Circle, Clock3 } from "lucide-react";
import type { ProblemStatus as Status } from "../../types/progress";

const details: Record<Status, { label: string; className: string; Icon: typeof Circle }> = {
  not_started: { label: "Not Started", className: "bg-slate-800 text-slate-400", Icon: Circle },
  in_progress: { label: "In Progress", className: "bg-amber-500/15 text-amber-300", Icon: Clock3 },
  completed: { label: "Completed", className: "bg-emerald-500/15 text-emerald-300", Icon: CheckCircle2 },
};

export function statusLabel(status: Status) {
  return details[status].label;
}

export function ProblemStatus({ status }: { status: Status }) {
  const { label, className, Icon } = details[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>
      <Icon size={13} /> {label}
    </span>
  );
}
