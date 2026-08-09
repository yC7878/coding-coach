import { CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import { useSessionTimer } from "../../hooks/useSessionTimer";
import { useProgress } from "../../hooks/useProgress";
import type { ActiveStudySession, SessionResult, SyntaxMistake } from "../../types/progress";
import { formatDuration } from "../../utils/progress";
import { SyntaxMistakeForm } from "./SyntaxMistakeForm";

const options: { value: SessionResult; label: string }[] = [
  { value: "independent", label: "Solved independently" },
  { value: "syntax_recall", label: "Solved it, but made a small syntax/recall mistake" },
  { value: "syntax_help", label: "Solved it, but needed syntax/API help" },
  { value: "algorithm_hint", label: "Needed an algorithm/pattern hint" },
  { value: "significant_help", label: "Needed significant help" },
  { value: "solution", label: "Needed the solution" },
];

const needsSyntaxDetails = (result?: SessionResult) => result === "syntax_recall" || result === "syntax_help";

export function FinishSessionModal({ session, onClose }: { session: ActiveStudySession; onClose: () => void }) {
  const { finishSession } = useProgress();
  const duration = useSessionTimer(session);
  const [result, setResult] = useState<SessionResult>();
  const [confidence, setConfidence] = useState<number>();
  const [syntaxMistakes, setSyntaxMistakes] = useState<SyntaxMistake[]>([]);
  const [notes, setNotes] = useState("");
  const syntaxValid = !needsSyntaxDetails(result) || (syntaxMistakes.length > 0 && syntaxMistakes.every((mistake) => mistake.entered.trim()));
  const save = () => {
    if (!result || !syntaxValid) return;
    finishSession(result, confidence, syntaxMistakes, notes);
    onClose();
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="finish-session-title"><div className="my-auto w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="subtle-label">Study session</p><h2 id="finish-session-title" className="mt-1 text-xl font-semibold text-slate-50">Complete Problem</h2></div><button type="button" aria-label="Close" onClick={onClose} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800"><X size={18} /></button></div><fieldset className="mt-6"><legend className="text-sm font-medium text-slate-200">How did it go?</legend><div className="mt-3 space-y-2">{options.map((option) => <button key={option.value} type="button" onClick={() => { setResult(option.value); if (!needsSyntaxDetails(option.value)) setSyntaxMistakes([]); }} className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left text-sm transition ${result === option.value ? "border-cyan-300 bg-cyan-300/10 text-cyan-100" : "border-slate-700 text-slate-300 hover:border-slate-600"}`}><span className={`flex h-4 w-4 items-center justify-center rounded-full border ${result === option.value ? "border-cyan-300" : "border-slate-500"}`}>{result === option.value && <span className="h-2 w-2 rounded-full bg-cyan-300" />}</span>{option.label}</button>)}</div></fieldset>{needsSyntaxDetails(result) && <><SyntaxMistakeForm mistakes={syntaxMistakes} onChange={setSyntaxMistakes} />{!syntaxValid && <p className="mt-2 text-xs text-amber-300">Select at least one API and record what you typed before saving.</p>}</>}<fieldset className="mt-6"><legend className="text-sm font-medium text-slate-200">How confident are you? <span className="font-normal text-slate-500">(optional)</span></legend><div className="mt-3 flex gap-2">{[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" aria-label={`Confidence ${value} of 5`} onClick={() => setConfidence(confidence === value ? undefined : value)} className={`h-10 w-10 rounded-lg border text-sm font-semibold transition ${confidence === value ? "border-cyan-300 bg-cyan-300 text-slate-950" : "border-slate-700 text-slate-400 hover:border-cyan-500"}`}>{value}</button>)}</div></fieldset><label className="mt-6 block text-sm font-medium text-slate-200">Notes <span className="font-normal text-slate-500">(optional)</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Anything to remember next time?" className="control mt-2 w-full resize-y" /></label><div className="mt-6 rounded-xl bg-slate-800/80 p-4"><p className="subtle-label">Time spent</p><p className="mt-1 text-xl font-semibold text-slate-100">{formatDuration(duration)}</p></div><div className="mt-7 flex flex-wrap justify-end gap-3"><button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-3.5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800">Cancel</button><button type="button" disabled={!result || !syntaxValid} onClick={save} className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"><CheckCircle2 size={16} />Save Session</button></div></div></div>;
}
