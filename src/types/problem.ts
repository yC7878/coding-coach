export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Problem {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  neetcodeUrl: string;
  leetcodeUrl?: string;
  patterns: string[];
}
