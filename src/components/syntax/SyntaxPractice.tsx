import { ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SyntaxQuestionType } from "../../types/syntax";
import { getSyntaxPracticeQuestion, validateSyntaxAnswer, type SyntaxPracticeQueueItem } from "../../utils/syntax";

const modes: { type: SyntaxQuestionType; label: string }[] = [
  { type: "multiple_choice", label: "Multiple choice" },
  { type: "fill_blank", label: "Fill the blank" },
  { type: "free_recall", label: "Free recall" },
];

export function SyntaxPractice({ queue, initialSyntaxId }: { queue: SyntaxPracticeQueueItem[]; initialSyntaxId?: string }) {
  const initialIndex = Math.max(0, queue.findIndex((item) => item.syntax.id === initialSyntaxId));
  const [index, setIndex] = useState(initialIndex);
  const [type, setType] = useState<SyntaxQuestionType>("multiple_choice");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<ReturnType<typeof validateSyntaxAnswer>>();
  const current = queue[index % queue.length];
  const question = useMemo(() => getSyntaxPracticeQuestion(current.syntax, type), [current.syntax, type]);

  useEffect(() => {
    setIndex(Math.max(0, queue.findIndex((item) => item.syntax.id === initialSyntaxId)));
    setAnswer("");
    setFeedback(undefined);
  }, [initialSyntaxId, queue]);

  const check = (value = answer) => setFeedback(validateSyntaxAnswer(current.syntax, type, value));
  const next = () => {
    setIndex((currentIndex) => (currentIndex + 1) % queue.length);
    setAnswer("");
    setFeedback(undefined);
  };
  const setMode = (nextType: SyntaxQuestionType) => {
    setType(nextType);
    setAnswer("");
    setFeedback(undefined);
  };
  return <section className="panel p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="subtle-label">Practice recall</p><h2 className="mt-1 text-xl font-semibold text-slate-100">{current.syntax.label}</h2><p className="mt-1 text-sm text-slate-400">{current.mistakes} recorded {current.mistakes === 1 ? "mistake" : "mistakes"}</p></div><button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"><RotateCcw size={14} />Next API</button></div><div className="mt-5 flex flex-wrap gap-2">{modes.map((mode) => <button key={mode.type} type="button" onClick={() => setMode(mode.type)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${type === mode.type ? "border-cyan-300 bg-cyan-300/10 text-cyan-100" : "border-slate-700 text-slate-400 hover:border-slate-600"}`}>{mode.label}</button>)}</div><div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/30 p-4 sm:p-5"><p className="text-sm font-medium text-slate-100">{question.prompt}</p>{type === "multiple_choice" ? <div className="mt-4 space-y-2">{question.options?.map((option, optionIndex) => <button key={option} type="button" onClick={() => { setAnswer(option); check(option); }} className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left font-mono text-sm transition ${answer === option ? "border-cyan-300 bg-cyan-300/10 text-cyan-100" : "border-slate-700 text-slate-300 hover:border-slate-600"}`}><span className="font-sans text-xs text-slate-500">{String.fromCharCode(65 + optionIndex)}.</span>{option}</button>)}</div> : <div className="mt-4"><input value={answer} onChange={(event) => { setAnswer(event.target.value); setFeedback(undefined); }} onKeyDown={(event) => { if (event.key === "Enter") check(); }} placeholder={type === "fill_blank" ? "Method name" : "Write the Java expression"} className="control w-full font-mono" /><button type="button" onClick={() => check()} className="mt-3 rounded-lg bg-cyan-300 px-3.5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200">Check answer</button></div>}{feedback && <div className={`mt-5 rounded-xl border p-4 ${feedback.correct ? "border-emerald-400/30 bg-emerald-400/10" : "border-amber-400/30 bg-amber-400/10"}`}><p className={`inline-flex items-center gap-2 font-semibold ${feedback.correct ? "text-emerald-200" : "text-amber-200"}`}>{feedback.correct && <CheckCircle2 size={16} />}{feedback.message}</p>{!feedback.correct && <><p className="mt-3 text-sm text-slate-300">You entered: <code className="rounded bg-slate-950/50 px-1.5 py-0.5 text-slate-100">{feedback.entered || "(blank)"}</code></p><p className="mt-2 text-sm text-slate-300">Correct: <code className="rounded bg-slate-950/50 px-1.5 py-0.5 text-cyan-100">{feedback.expected}</code></p></>}<p className="mt-3 text-sm text-slate-300">Remember: {feedback.hint}</p><button type="button" onClick={next} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100">Practice next <ArrowRight size={15} /></button></div>}</div></section>;
}
