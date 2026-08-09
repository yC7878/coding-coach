import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import syntaxData from "../../data/syntax.json";
import type { SyntaxMistake } from "../../types/progress";
import type { SyntaxReference } from "../../types/syntax";

const syntaxReferences = syntaxData as SyntaxReference[];
const commonIds = ["arrays-equals", "arrays-sort", "string-to-char-array", "hash-map-get", "hash-map-get-or-default"];

export function SyntaxMistakeForm({ mistakes, onChange }: { mistakes: SyntaxMistake[]; onChange: (mistakes: SyntaxMistake[]) => void }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const selectedIds = new Set(mistakes.map((mistake) => mistake.syntaxId));
  const displayedReferences = useMemo(() => {
    if (query.trim()) {
      const needle = query.toLowerCase();
      return syntaxReferences.filter((item) => [item.label, item.expression, item.category].some((value) => value.toLowerCase().includes(needle)));
    }
    return showAll ? syntaxReferences : syntaxReferences.filter((item) => commonIds.includes(item.id));
  }, [query, showAll]);
  const toggle = (syntax: SyntaxReference) => {
    if (selectedIds.has(syntax.id)) onChange(mistakes.filter((mistake) => mistake.syntaxId !== syntax.id));
    else onChange([...mistakes, { syntaxId: syntax.id, expected: syntax.expression, entered: "" }]);
  };
  const setEntered = (syntaxId: string, entered: string) => onChange(mistakes.map((mistake) => mistake.syntaxId === syntaxId ? { ...mistake, entered } : mistake));
  return <fieldset className="mt-6 border-t border-slate-800 pt-6"><legend className="text-sm font-medium text-slate-200">What did you get wrong?</legend><label className="control mt-3 flex items-center gap-2"><Search size={15} className="text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Java APIs…" className="min-w-0 flex-1 bg-transparent outline-none" /></label><p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{query ? "Matching APIs" : "Common APIs"}</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{displayedReferences.map((syntax) => <label key={syntax.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${selectedIds.has(syntax.id) ? "border-cyan-300/60 bg-cyan-300/10 text-cyan-100" : "border-slate-700 text-slate-300 hover:border-slate-600"}`}><input type="checkbox" checked={selectedIds.has(syntax.id)} onChange={() => toggle(syntax)} className="accent-cyan-300" />{syntax.label}</label>)}</div>{displayedReferences.length === 0 && <p className="mt-3 text-sm text-slate-500">No Java APIs match that search.</p>}{!showAll && !query && <button type="button" onClick={() => setShowAll(true)} className="mt-3 text-sm font-medium text-cyan-300 hover:text-cyan-200">+ Add another mistake</button>}{mistakes.length > 0 && <div className="mt-5 space-y-4">{mistakes.map((mistake) => { const syntax = syntaxReferences.find((item) => item.id === mistake.syntaxId); return <div key={mistake.syntaxId} className="rounded-xl border border-slate-700 bg-slate-950/30 p-3.5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-slate-100">API: {syntax?.label ?? mistake.syntaxId}</p><p className="mt-1 font-mono text-xs text-slate-500">Expected: {mistake.expected}</p></div><button type="button" onClick={() => onChange(mistakes.filter((item) => item.syntaxId !== mistake.syntaxId))} className="text-xs font-medium text-slate-500 hover:text-rose-300">Remove</button></div><label className="mt-3 block text-sm text-slate-300">What did you type?<input value={mistake.entered} onChange={(event) => setEntered(mistake.syntaxId, event.target.value)} placeholder={mistake.expected} className="control mt-1.5 w-full font-mono" /></label></div>; })}</div>}</fieldset>;
}
