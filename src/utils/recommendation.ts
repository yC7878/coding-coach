import type { Problem } from "../types/problem";
import type { ProgressMap } from "../types/progress";
import { getIncompleteProblems } from "./progress";

/** Phase 1 placeholder; replace this with an adaptive planner in Phase 3. */
export function getTodayRecommendation(problems: Problem[], progress: ProgressMap): Problem | undefined {
  return getIncompleteProblems(problems, progress)[0];
}
