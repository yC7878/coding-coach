import { beforeEach, describe, expect, it } from "vitest";
import {
  ACTIVE_SESSION_STORAGE_KEY,
  PROGRESS_STORAGE_KEY,
  createProgressExport,
  finishActiveSession,
  getActiveSession,
  getActiveSessionDuration,
  getProgress,
  parseProgressImport,
  pauseActiveSession,
  resumeActiveSession,
  startActiveSession,
  updateProblemProgress,
} from "./progressService";

const at = (seconds: number) => new Date(Date.UTC(2026, 7, 8, 20, 0, seconds));

describe("progress storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("persists versioned session-aware progress", () => {
    updateProblemProgress("two-sum", { status: "completed", completedAt: "2026-08-08", confidence: 4, sessions: [] });
    expect(getProgress()).toEqual({ "two-sum": { status: "completed", completedAt: "2026-08-08", confidence: 4, sessions: [] } });
    expect(JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY) ?? "{}").version).toBe(4);
  });

  it("migrates original Phase 1 records without a sessions field", () => {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify({ "two-sum": { status: "completed", completedAt: "2026-08-08", confidence: 4 } }));
    expect(getProgress()["two-sum"]).toEqual({ status: "completed", completedAt: "2026-08-08", confidence: 4, sessions: [] });
  });

  it("persists exact syntax mistakes with session history", () => {
    updateProblemProgress("two-sum", {
      status: "completed",
      sessions: [{ id: "syntax-session", startedAt: "2026-08-08T20:00:00.000Z", endedAt: "2026-08-08T20:01:00.000Z", durationSeconds: 60, result: "syntax_help", syntaxMistakes: [{ syntaxId: "arrays-equals", entered: "Arrays.equal(a, b)", expected: "Arrays.equals(a, b)" }] }],
    });
    expect(getProgress()["two-sum"].sessions[0].syntaxMistakes).toEqual([{ syntaxId: "arrays-equals", entered: "Arrays.equal(a, b)", expected: "Arrays.equals(a, b)" }]);
  });

  it("tolerates invalid local storage data", () => {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, "not-json");
    expect(getProgress()).toEqual({});
  });
});

describe("active study sessions", () => {
  beforeEach(() => window.localStorage.clear());

  it("starts and restores an active session", () => {
    const session = startActiveSession("two-sum", at(0));
    expect(getActiveSession()).toEqual(session);
    expect(window.localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)).toContain("two-sum");
  });

  it("calculates duration from timestamps and excludes paused time", () => {
    const started = startActiveSession("two-sum", at(0));
    expect(getActiveSessionDuration(started, at(12))).toBe(12);
    const paused = pauseActiveSession(at(12));
    expect(paused?.accumulatedActiveSeconds).toBe(12);
    expect(getActiveSessionDuration(paused!, at(40))).toBe(12);
    const resumed = resumeActiveSession(at(40));
    expect(resumed?.pausedDurationSeconds).toBe(28);
    expect(getActiveSessionDuration(resumed!, at(55))).toBe(27);
  });

  it("finishes a session, records its result, and clears the active timer", () => {
    startActiveSession("two-sum", at(0));
    pauseActiveSession(at(10));
    resumeActiveSession(at(30));
    const finished = finishActiveSession(at(50), "independent", 5);
    expect(finished).toMatchObject({ durationSeconds: 30, result: "independent", confidence: 5, pausedDurationSeconds: 20 });
    expect(getActiveSession()).toBeNull();
  });

  it("records multiple exact syntax mistakes in one completed session", () => {
    startActiveSession("two-sum", at(0));
    const finished = finishActiveSession(at(20), "syntax_recall", 4, [
      { syntaxId: "arrays-equals", entered: "Arrays.equal(a, b)", expected: "Arrays.equals(a, b)" },
      { syntaxId: "string-to-char-array", entered: "s.toChars()", expected: "s.toCharArray()" },
    ]);
    expect(finished).toMatchObject({
      result: "syntax_recall",
      syntaxMistakes: [
        { syntaxId: "arrays-equals", entered: "Arrays.equal(a, b)" },
        { syntaxId: "string-to-char-array", entered: "s.toChars()" },
      ],
    });
  });
});

describe("progress imports and exports", () => {
  const progress = { "two-sum": { status: "completed" as const, completedAt: "2026-08-08", confidence: 4, sessions: [{ id: "one", startedAt: "2026-08-08T20:00:00.000Z", endedAt: "2026-08-08T20:10:00.000Z", durationSeconds: 600, result: "syntax_recall" as const, syntaxMistakes: [{ syntaxId: "arrays-equals", entered: "Arrays.equal(a, b)", expected: "Arrays.equals(a, b)" }] }] } };

  it("creates a version 4 export that validates performance-aware progress on import", () => {
    const exported = createProgressExport(progress);
    expect(exported.version).toBe(4);
    expect(parseProgressImport(exported)).toEqual(progress);
  });

  it("accepts a Phase 1 export and supplies empty session arrays", () => {
    expect(parseProgressImport({ version: 1, exportedAt: "2026-08-08T20:00:00.000Z", progress: { "two-sum": { status: "completed", completedAt: "2026-08-08" } } })).toEqual({ "two-sum": { status: "completed", completedAt: "2026-08-08", sessions: [] } });
  });

  it("migrates the Phase 2 result taxonomy without losing session history", () => {
    const imported = parseProgressImport({ version: 2, exportedAt: "2026-08-08T20:00:00.000Z", progress: { "two-sum": { status: "completed", sessions: [{ id: "old", startedAt: "2026-08-08T20:00:00.000Z", endedAt: "2026-08-08T20:01:00.000Z", durationSeconds: 60, result: "needed_hint" }] } } });
    expect(imported?.["two-sum"].sessions[0].result).toBe("algorithm_hint");
  });

  it("rejects malformed imported data", () => {
    expect(parseProgressImport({ version: 3, exportedAt: "today", progress: { "two-sum": { status: "done", sessions: [] } } })).toBeNull();
  });
});
