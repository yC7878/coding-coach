import { useMemo, useState } from "react";
import categories from "../data/categories.json";
import problemsData from "../data/problems.json";
import { ProblemFilters, type ProblemFiltersValue } from "../components/problems/ProblemFilters";
import { ProblemList } from "../components/problems/ProblemList";
import { useProgress } from "../hooks/useProgress";
import type { Problem } from "../types/problem";
import { getProblemStatus } from "../utils/progress";

const problems = problemsData as Problem[];
const initialFilters: ProblemFiltersValue = { search: "", category: "all", difficulty: "all", status: "all" };

export function Problems() {
  const { progress, toggleCompleted } = useProgress();
  const [filters, setFilters] = useState(initialFilters);
  const filteredProblems = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    return problems.filter((problem) => {
      const matchesSearch = !query || [problem.title, problem.category, ...problem.patterns].some((value) => value.toLowerCase().includes(query));
      return matchesSearch && (filters.category === "all" || problem.category === filters.category) && (filters.difficulty === "all" || problem.difficulty === filters.difficulty) && (filters.status === "all" || getProblemStatus(progress, problem.id) === filters.status);
    });
  }, [filters, progress]);
  return <div className="space-y-5"><ProblemFilters value={filters} categories={categories} onChange={setFilters} /><div className="flex items-center justify-between"><p className="text-sm text-slate-400"><span className="font-medium text-slate-200">{filteredProblems.length}</span> {filteredProblems.length === 1 ? "problem" : "problems"} shown</p><button type="button" className="text-sm text-blue-300 hover:text-blue-200" onClick={() => setFilters(initialFilters)}>Clear filters</button></div><ProblemList problems={filteredProblems} progress={progress} onToggle={toggleCompleted} /></div>;
}
