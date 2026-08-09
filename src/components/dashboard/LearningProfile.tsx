import { BarChart3, Target } from "lucide-react";
import type { PerformanceProfile } from "../../types/performance";

const skills = [
  { key: "algorithm", label: "Algorithm Understanding" },
  { key: "syntaxRecall", label: "Syntax Recall" },
  { key: "speed", label: "Solve Speed" },
  { key: "confidence", label: "Confidence" },
] as const;

export function LearningProfile({ profile, focusAreas }: { profile: PerformanceProfile; focusAreas: string[] }) {
  const totalSamples = Math.max(...skills.map(({ key }) => profile[key].sampleSize), 0);

  return (
    <section className="panel p-5 sm:p-7">
      <div className="flex items-center gap-2 text-cyan-200">
        <BarChart3 size={17} />
        <span className="subtle-label !text-cyan-200">Your learning profile</span>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
        Separate signals keep algorithm understanding, Java recall, speed, and self-reported confidence explainable.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {skills.map(({ key, label }) => {
          const skill = profile[key];
          const reliable = skill.confidence !== "low";
          return (
            <div key={key} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-slate-200">{label}</p>
                {reliable && <span className="text-lg font-semibold text-cyan-200">{skill.score}</span>}
              </div>
              {reliable ? <>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400" style={{ width: `${skill.score}%` }} /></div>
                <p className="mt-2 text-xs text-slate-500">Based on {skill.sampleSize} recorded sessions · {skill.confidence} confidence</p>
              </> : <p className="mt-2 text-sm text-slate-400">Not enough data yet · {skill.sampleSize} recorded {skill.sampleSize === 1 ? "session" : "sessions"}</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-6 border-t border-slate-800 pt-5">
        <div className="flex items-center gap-2 text-slate-200"><Target size={17} className="text-amber-300" /><h3 className="font-semibold">Areas to focus on</h3></div>
        {focusAreas.length ? <ol className="mt-3 grid gap-2 sm:grid-cols-3">{focusAreas.map((area, index) => <li key={area} className="rounded-lg bg-slate-950/30 px-3 py-2 text-sm text-slate-300"><span className="mr-2 font-semibold text-amber-200">{index + 1}.</span>{area}</li>)}</ol> : <p className="mt-3 text-sm text-slate-400">Complete a few sessions to identify focus areas responsibly.</p>}
        {totalSamples > 0 && <p className="mt-3 text-xs text-slate-600">Scores use configurable Phase 2 heuristics and become more reliable with more sessions.</p>}
      </div>
    </section>
  );
}
