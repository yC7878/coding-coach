import { useMemo } from "react";
import categories from "../data/categories.json";
import problemsData from "../data/problems.json";
import { CategoryProgress } from "../components/dashboard/CategoryProgress";
import { LearningProfile } from "../components/dashboard/LearningProfile";
import { ProgressOverview } from "../components/dashboard/ProgressOverview";
import { RecentProblems } from "../components/dashboard/RecentProblems";
import { SyntaxRecallInsight } from "../components/dashboard/SyntaxRecallInsight";
import { TodayRecommendation } from "../components/dashboard/TodayRecommendation";
import { useProgress } from "../hooks/useProgress";
import { getTodayRecommendation } from "../services/recommendationService";
import { getCategoryPerformance, getFocusAreas, getPerformanceProfile } from "../services/weaknessService";
import type { Problem } from "../types/problem";
import { formatDuration, getAverageSolveTime, getCategoryStats, getOverallProgress, getRecentCompletedProblems, getSyntaxStats } from "../utils/progress";

const problems = problemsData as Problem[];

export function Dashboard() {
  const { progress } = useProgress();
  const stats = useMemo(() => getOverallProgress(problems, progress), [progress]);
  const categoryStats = useMemo(() => getCategoryStats(problems, progress, categories), [progress]);
  const recent = useMemo(() => getRecentCompletedProblems(problems, progress), [progress]);
  const categoryPerformance = useMemo(() => getCategoryPerformance(problems, progress, categories), [progress]);
  const learningProfile = useMemo(() => getPerformanceProfile(problems, progress), [progress]);
  const focusAreas = useMemo(() => getFocusAreas(categoryPerformance, learningProfile), [categoryPerformance, learningProfile]);
  const recommendation = useMemo(() => getTodayRecommendation({ problems, progress, categoryPerformance }), [progress, categoryPerformance]);
  const averageSolveTime = useMemo(() => getAverageSolveTime(progress), [progress]);
  const syntaxStats = useMemo(() => getSyntaxStats(progress), [progress]);
  return <div className="space-y-6"><TodayRecommendation recommendation={recommendation} /><ProgressOverview stats={stats} averageSolveTime={averageSolveTime ? formatDuration(averageSolveTime) : undefined} /><LearningProfile profile={learningProfile} focusAreas={focusAreas} />{syntaxStats.affectedApis > 0 && <SyntaxRecallInsight mistakes={syntaxStats.mostFrequent.slice(0, 3)} affectedApis={syntaxStats.affectedApis} />}<div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]"><CategoryProgress stats={categoryStats} /><RecentProblems problems={recent} /></div></div>;
}
