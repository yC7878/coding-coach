/**
 * Phase 2 heuristic inputs, not scientifically validated learning measurements.
 * Higher values represent stronger evidence of independent algorithm understanding.
 */
export const weaknessWeights = {
  minimumSampleSize: 3,
  algorithmByResult: {
    independent: 95,
    syntax_recall: 92,
    syntax_help: 84,
    algorithm_hint: 58,
    significant_help: 32,
    solution: 12,
  },
  syntaxByResult: {
    independent: 92,
    syntax_recall: 70,
    syntax_help: 45,
    algorithm_hint: 88,
    significant_help: 82,
    solution: 80,
  },
  syntaxMistakePenalty: 7,
  /** Target independent study time by difficulty, in seconds. */
  targetSolveSeconds: { Easy: 15 * 60, Medium: 30 * 60, Hard: 45 * 60 },
  confidenceScale: 20,
  categoryWeight: { algorithm: 0.45, syntax: 0.2, speed: 0.2, confidence: 0.15 },
} as const;
