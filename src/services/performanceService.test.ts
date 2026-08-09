import { describe, expect, it } from "vitest";
import { applyPerformanceOverride, getEffectivePerformanceDetails } from "./performanceService";
import type { ProblemProgress } from "../types/progress";

describe("performance details", () => {
  it("uses user overrides with provenance without changing the original session", () => {
    const progress: ProblemProgress = {
      status: "completed",
      sessions: [{ id: "session", startedAt: "2026-08-08T20:00:00.000Z", endedAt: "2026-08-08T20:20:00.000Z", durationSeconds: 1200, result: "algorithm_hint", confidence: 2 }],
    };
    const performance = applyPerformanceOverride(undefined, {
      solveTimeSeconds: { value: 900, source: "user_override" },
      result: { value: "independent", source: "user_override" },
      notes: { value: "Used a cleaner second pass.", source: "user_override" },
    });
    const effective = getEffectivePerformanceDetails({ ...progress, performance });
    expect(effective.solveTimeSeconds).toEqual({ value: 900, source: "user_override" });
    expect(effective.result).toEqual({ value: "independent", source: "user_override" });
    expect(effective.notes).toEqual({ value: "Used a cleaner second pass.", source: "user_override" });
    expect(progress.sessions[0]).toMatchObject({ durationSeconds: 1200, result: "algorithm_hint" });
  });

  it("keeps session values as user-sourced defaults when there is no override", () => {
    const effective = getEffectivePerformanceDetails({ status: "completed", sessions: [{ id: "session", startedAt: "2026-08-08T20:00:00.000Z", endedAt: "2026-08-08T20:10:00.000Z", durationSeconds: 600, result: "independent", confidence: 5 }] });
    expect(effective).toMatchObject({ solveTimeSeconds: { source: "user", value: 600 }, result: { source: "user", value: "independent" }, confidence: { source: "user", value: 5 } });
  });

  it("allows an editor to clear an existing override without deleting history", () => {
    const updated = applyPerformanceOverride({ notes: { value: "Old note", source: "user_override" } }, { notes: undefined });
    expect(updated.notes).toBeUndefined();
  });
});
