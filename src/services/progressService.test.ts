import { beforeEach, describe, expect, it } from "vitest";
import {
  PROGRESS_STORAGE_KEY,
  createProgressExport,
  getProgress,
  parseProgressImport,
  toggleProblemCompleted,
  updateProblemProgress,
} from "./progressService";

describe("progress storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("persists and restores problem progress", () => {
    updateProblemProgress("two-sum", { status: "completed", completedAt: "2026-08-08", confidence: 4 });
    expect(getProgress()).toEqual({ "two-sum": { status: "completed", completedAt: "2026-08-08", confidence: 4 } });
  });

  it("toggles completed progress back to not started", () => {
    updateProblemProgress("two-sum", { status: "completed", completedAt: "2026-08-08" });
    toggleProblemCompleted("two-sum");
    expect(getProgress()["two-sum"]).toEqual({ status: "not_started" });
  });

  it("tolerates invalid local storage data", () => {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, "not-json");
    expect(getProgress()).toEqual({});
  });
});

describe("progress imports and exports", () => {
  const progress = { "two-sum": { status: "completed" as const, completedAt: "2026-08-08", confidence: 4 } };

  it("creates a versioned export that validates on import", () => {
    const exported = createProgressExport(progress);
    expect(parseProgressImport(exported)).toEqual(progress);
  });

  it("rejects malformed imported data", () => {
    expect(parseProgressImport({ version: 1, exportedAt: "today", progress: { "two-sum": { status: "done" } } })).toBeNull();
  });
});
