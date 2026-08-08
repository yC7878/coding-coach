import type { Difficulty } from "../../types/problem";
import type { ProblemStatus } from "../../types/progress";

export interface ProblemFiltersValue {
  search: string;
  category: string;
  difficulty: Difficulty | "all";
  status: ProblemStatus | "all";
}

interface ProblemFiltersProps {
  value: ProblemFiltersValue;
  categories: string[];
  onChange: (value: ProblemFiltersValue) => void;
}

export function ProblemFilters({ value, categories, onChange }: ProblemFiltersProps) {
  const update = <K extends keyof ProblemFiltersValue>(key: K, nextValue: ProblemFiltersValue[K]) => onChange({ ...value, [key]: nextValue });
  return (
    <section className="panel grid gap-3 p-4 md:grid-cols-4" aria-label="Problem filters">
      <label className="md:col-span-1">
        <span className="sr-only">Search problems</span>
        <input className="control w-full" value={value.search} onChange={(event) => update("search", event.target.value)} placeholder="Search title, category, pattern…" />
      </label>
      <label>
        <span className="sr-only">Category</span>
        <select className="control w-full" value={value.category} onChange={(event) => update("category", event.target.value)}>
          <option value="all">All categories</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
      </label>
      <label>
        <span className="sr-only">Difficulty</span>
        <select className="control w-full" value={value.difficulty} onChange={(event) => update("difficulty", event.target.value as ProblemFiltersValue["difficulty"])}>
          <option value="all">All difficulties</option><option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
        </select>
      </label>
      <label>
        <span className="sr-only">Status</span>
        <select className="control w-full" value={value.status} onChange={(event) => update("status", event.target.value as ProblemFiltersValue["status"])}>
          <option value="all">All statuses</option><option value="not_started">Not Started</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
        </select>
      </label>
    </section>
  );
}
