import type { ProgressMap } from "../types/progress";
import type { SyntaxAnswerFeedback, SyntaxPracticeQuestion, SyntaxQuestionType, SyntaxReference } from "../types/syntax";
import { getMostFrequentSyntaxMistakes } from "./progress";

export interface SyntaxPracticeQueueItem {
  syntax: SyntaxReference;
  mistakes: number;
}

const normalizeAnswer = (value: string) => value.trim().replace(/;$/, "").replace(/\s+/g, "");

const nearMisses = (syntax: SyntaxReference) => {
  const missingLastCharacter = syntax.method.length > 1 ? syntax.method.slice(0, -1) : `${syntax.method}Method`;
  const wrongOwner = syntax.expression.replace(/^[A-Za-z]+/, (owner) => owner.length > 1 ? owner.slice(0, -1) : `${owner}Util`);
  const wrongMethod = syntax.expression.replace(`.${syntax.method}`, `.${missingLastCharacter}`);
  const noInvocation = syntax.expression.replace(/\((.*)\)$/, "");
  return [wrongMethod, wrongOwner, noInvocation].filter((option, index, options) => option !== syntax.expression && options.indexOf(option) === index);
};

export function getSyntaxPracticeQuestion(syntax: SyntaxReference, type: SyntaxQuestionType): SyntaxPracticeQuestion {
  if (type === "fill_blank") return { type, prompt: syntax.fillPrompt, expected: syntax.method };
  if (type === "free_recall") return { type, prompt: syntax.freeRecallPrompt, expected: syntax.expression };
  const [firstMiss, secondMiss, thirdMiss] = nearMisses(syntax);
  return {
    type,
    prompt: "Which Java expression is correct?",
    expected: syntax.expression,
    options: [firstMiss, secondMiss, syntax.expression, thirdMiss ?? `${syntax.expression}.`],
  };
}

export function validateSyntaxAnswer(syntax: SyntaxReference, type: SyntaxQuestionType, entered: string): SyntaxAnswerFeedback {
  const expected = type === "fill_blank" ? syntax.method : syntax.expression;
  const normalizedEntered = normalizeAnswer(entered);
  const normalizedExpected = normalizeAnswer(expected);
  const correct = type === "fill_blank"
    ? normalizedEntered.replace(/\(\)$/, "") === normalizedExpected
    : normalizedEntered === normalizedExpected;
  return {
    correct,
    entered,
    expected,
    message: correct ? "Correct!" : "Almost!",
    hint: syntax.hint,
  };
}

/** A simple frequency-first queue; Phase 2 can replace this with spaced repetition. */
export function getSyntaxPracticeQueue(
  syntaxReferences: SyntaxReference[],
  progress: ProgressMap,
  focusIds: string[] = [],
): SyntaxPracticeQueueItem[] {
  const countById = new Map(getMostFrequentSyntaxMistakes(progress).map((item) => [item.syntaxId, item.count]));
  const focus = new Set(focusIds.filter((id) => countById.has(id)));
  return syntaxReferences
    .flatMap((syntax) => {
      const mistakes = countById.get(syntax.id) ?? 0;
      return mistakes > 0 ? [{ syntax, mistakes }] : [];
    })
    .sort((a, b) => Number(focus.has(b.syntax.id)) - Number(focus.has(a.syntax.id)) || b.mistakes - a.mistakes || a.syntax.label.localeCompare(b.syntax.label));
}
