import { Check, X } from "lucide-react";
import { useState } from "react";
import { useProgress } from "../../hooks/useProgress";
import type { Problem } from "../../types/problem";
import type { SessionResult, SyntaxMistake } from "../../types/progress";
import type { AlgorithmUnderstanding, PerformanceDetails } from "../../types/performance";
import { applyPerformanceOverride, getEffectivePerformanceDetails } from "../../services/performanceService";
import { formatTimer } from "../../utils/progress";
import { SyntaxMistakeForm } from "../study/SyntaxMistakeForm";

const resultOptions: { value: SessionResult; label: string }[] = [
  { value: "independent", label: "Solved independently" },
  { value: "syntax_recall", label: "Small syntax/recall mistake" },
  { value: "syntax_help", label: "Needed syntax/API help" },
  { value: "algorithm_hint", label: "Needed algorithm/pattern hint" },
  { value: "significant_help", label: "Needed significant help" },
  { value: "solution", label: "Needed the solution" },
];

const sources = <T,>(value: T) => ({ value, source: "user_override" as const });

function parseTimer(value: string): number | undefined {
  const match = value.trim().match(/^(\d+):(\d{2})(?::(\d{2}))?$/);
  if (!match) return undefined;
  const first = Number(match[1]);
  const second = Number(match[2]);
  const third = match[3] === undefined ? 0 : Number(match[3]);
  if (second >= 60 || third >= 60) return undefined;
  return match[3] === undefined ? first * 60 + second : first * 3600 + second * 60 + third;
}

export function EditPerformanceModal({ problem, onClose, initialSyntaxMistakes }: { problem: Problem; onClose: () => void; initialSyntaxMistakes?: SyntaxMistake[] }) {
  const { progress, updateProblem } = useProgress();
  const current = progress[problem.id];
  const effective = getEffectivePerformanceDetails(current);
  const [solveTime, setSolveTime] = useState(effective.solveTimeSeconds ? formatTimer(effective.solveTimeSeconds.value) : "");
  const [result, setResult] = useState<SessionResult | "">(effective.result?.value ?? "");
  const [confidence, setConfidence] = useState<number | undefined>(effective.confidence?.value);
  const [algorithmUnderstanding, setAlgorithmUnderstanding] = useState<AlgorithmUnderstanding | "">(effective.algorithmUnderstanding?.value ?? "");
  const [pattern, setPattern] = useState(effective.pattern?.value ?? problem.patterns[0] ?? "");
  const [syntaxMistakes, setSyntaxMistakes] = useState<SyntaxMistake[]>(() => {
    const existing = effective.syntaxIssues?.value ?? [];
    if (!initialSyntaxMistakes) return existing;
    return [...existing, ...initialSyntaxMistakes].filter((mistake, index, items) => items.findIndex((item) => item.syntaxId === mistake.syntaxId && item.entered === mistake.entered && item.expected === mistake.expected) === index);
  });
  const [notes, setNotes] = useState(effective.notes?.value ?? "");
  const [error, setError] = useState<string>();
  const save = () => {
    const seconds = solveTime ? parseTimer(solveTime) : undefined;
    if (solveTime && seconds === undefined) { setError("Use mm:ss or hh:mm:ss for solve time."); return; }
    const changes: PerformanceDetails = {
      solveTimeSeconds: seconds !== undefined ? sources(seconds) : undefined,
      result: result ? sources(result) : undefined,
      confidence: confidence ? sources(confidence) : undefined,
      algorithmUnderstanding: algorithmUnderstanding ? sources(algorithmUnderstanding) : undefined,
      pattern: pattern.trim() ? sources(pattern.trim()) : undefined,
      syntaxIssues: sources(syntaxMistakes),
      notes: notes.trim() ? sources(notes.trim()) : undefined,
    };
    updateProblem(problem.id, { performance: applyPerformanceOverride(current?.performance, changes) });
    onClose();
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="edit-performance-title"><div className="my-auto w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="subtle-label">User override</p><h2 id="edit-performance-title" className="mt-1 text-xl font-semibold text-slate-50">Edit Performance Details</h2><p className="mt-1 text-sm text-slate-400">Your edits take precedence without deleting sessions or GitHub analysis.</p></div><button type="button" aria-label="Close" onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800"><X size={18} /></button></div><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="block text-sm font-medium text-slate-200">Solve time<input value={solveTime} onChange={(event) => setSolveTime(event.target.value)} placeholder="18:42" className="control mt-2 w-full font-mono" /></label><label className="block text-sm font-medium text-slate-200">Result<select value={result} onChange={(event) => setResult(event.target.value as SessionResult | "")} className="control mt-2 w-full"><option value="">Not recorded</option>{resultOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><div><p className="text-sm font-medium text-slate-200">Confidence</p><div className="mt-2 flex gap-2">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" onClick={() => setConfidence(confidence === value ? undefined : value)} className={`h-9 w-9 rounded-lg border text-sm font-semibold ${confidence === value ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-slate-700 text-slate-400 hover:border-cyan-500"}`}>{value}</button>)}</div></div><label className="block text-sm font-medium text-slate-200">Algorithm understanding<select value={algorithmUnderstanding} onChange={(event) => setAlgorithmUnderstanding(event.target.value as AlgorithmUnderstanding | "")} className="control mt-2 w-full"><option value="">Not classified</option><option value="strong">Strong</option><option value="developing">Developing</option><option value="needs_support">Needs support</option></select></label><label className="block text-sm font-medium text-slate-200 sm:col-span-2">Pattern<input value={pattern} onChange={(event) => setPattern(event.target.value)} placeholder="Sorting" className="control mt-2 w-full" /></label></div><SyntaxMistakeForm mistakes={syntaxMistakes} onChange={setSyntaxMistakes} /><label className="mt-6 block text-sm font-medium text-slate-200">Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="control mt-2 w-full resize-y" placeholder="Add or correct context for this performance record." /></label>{error && <p role="alert" className="mt-3 text-sm text-rose-300">{error}</p>}<div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-3.5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800">Cancel</button><button type="button" onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200"><Check size={16} />Save overrides</button></div></div></div>;
}
