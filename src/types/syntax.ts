export type SyntaxQuestionType = "multiple_choice" | "fill_blank" | "free_recall";

/** Immutable Java API reference metadata. User mistakes live only in progress storage. */
export interface SyntaxReference {
  id: string;
  category: string;
  label: string;
  expression: string;
  method: string;
  fillPrompt: string;
  freeRecallPrompt: string;
  hint: string;
}

export interface SyntaxPracticeQuestion {
  type: SyntaxQuestionType;
  prompt: string;
  expected: string;
  options?: string[];
}

export interface SyntaxAnswerFeedback {
  correct: boolean;
  entered: string;
  expected: string;
  message: string;
  hint: string;
}
