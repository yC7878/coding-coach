import { Download, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useProgress } from "../hooks/useProgress";
import { createProgressExport, parseProgressImport } from "../services/progressService";

export function Settings() {
  const { progress, replaceProgress, resetProgress } = useProgress();
  const [message, setMessage] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const exportProgress = () => {
    const contents = JSON.stringify(createProgressExport(progress), null, 2);
    const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `neetcode-coach-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Progress exported as JSON.");
  };
  const importProgress = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const nextProgress = parseProgressImport(parsed);
      if (!nextProgress) throw new Error("invalid");
      replaceProgress(nextProgress);
      setMessage("Progress imported successfully.");
    } catch {
      setMessage("That file isn’t a valid NeetCode Coach progress export.");
    } finally {
      event.target.value = "";
    }
  };
  const reset = () => {
    if (!window.confirm("Reset all saved NeetCode Coach progress? This cannot be undone unless you exported it first.")) return;
    resetProgress();
    setMessage("Progress has been reset.");
  };
  return <section className="max-w-2xl panel p-5 sm:p-7"><p className="subtle-label">Progress data</p><h2 className="mt-1 text-xl font-semibold text-slate-100">Manage your local data</h2><p className="mt-2 text-sm leading-6 text-slate-400">Your progress is stored only in this browser. Export a copy before clearing browser data or moving to another device.</p><div className="mt-7 space-y-3"><button type="button" onClick={exportProgress} className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-left transition hover:border-slate-500"><span><span className="block font-medium text-slate-100">Export Progress</span><span className="mt-1 block text-sm text-slate-500">Download your completed problems and confidence ratings.</span></span><Download className="text-blue-300" size={19} /></button><input ref={inputRef} type="file" accept="application/json,.json" className="sr-only" onChange={importProgress} /><button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-left transition hover:border-slate-500"><span><span className="block font-medium text-slate-100">Import Progress</span><span className="mt-1 block text-sm text-slate-500">Restore a previously exported NeetCode Coach JSON file.</span></span><Upload className="text-cyan-300" size={19} /></button><button type="button" onClick={reset} className="flex w-full items-center justify-between rounded-xl border border-rose-500/25 bg-rose-500/[0.04] p-4 text-left transition hover:border-rose-400/50"><span><span className="block font-medium text-rose-200">Reset Progress</span><span className="mt-1 block text-sm text-slate-500">Remove all saved progress from this browser.</span></span><RotateCcw className="text-rose-300" size={19} /></button></div>{message && <p role="status" className="mt-5 rounded-lg bg-slate-800 px-3 py-2.5 text-sm text-slate-300">{message}</p>}</section>;
}
