import { useMemo } from "react";
import categories from "../data/categories.json";
import problemsData from "../data/problems.json";
import { CategoryProgress } from "../components/dashboard/CategoryProgress";
import { ProgressOverview } from "../components/dashboard/ProgressOverview";
import { RecentProblems } from "../components/dashboard/RecentProblems";
import { TodayRecommendation } from "../components/dashboard/TodayRecommendation";
import { useProgress } from "../hooks/useProgress";
import type { Problem } from "../types/problem";
import { formatDuration, getAverageSolveTime, getCategoryStats, getOverallProgress, getRecentCompletedProblems } from "../utils/progress";
import { getTodayRecommendation } from "../utils/recommendation";

const problems = problemsData as Problem[];

export function Dashboard() {
  const { progress } = useProgress();
  const stats = useMemo(() => getOverallProgress(problems, progress), [progress]);
  const categoryStats = useMemo(() => getCategoryStats(problems, progress, categories), [progress]);
  const recent = useMemo(() => getRecentCompletedProblems(problems, progress), [progress]);
  const recommendation = useMemo(() => getTodayRecommendation(problems, { progress }), [progress]);
  const averageSolveTime = useMemo(() => getAverageSolveTime(progress), [progress]);
  return <div className="space-y-6"><TodayRecommendation recommendation={recommendation} /><ProgressOverview stats={stats} averageSolveTime={averageSolveTime ? formatDuration(averageSolveTime) : undefined} /><div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]"><CategoryProgress stats={categoryStats} /><RecentProblems problems={recent} /></div></div>;
}
