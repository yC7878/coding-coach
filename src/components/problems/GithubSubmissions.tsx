import { Braces, ChevronDown, Github } from "lucide-react";
import { useState } from "react";
import { useGithubSync } from "../../hooks/useGithubSync";
import type { GithubSubmission } from "../../types/github";
import type { DetectedSyntaxIssue } from "../../types/performance";

const ordered = (submissions: GithubSubmission[]) => [...submissions].sort((a, b) => Number(b.filename.match(/submission-(\d+)/)?.[1] ?? -1) - Number(a.filename.match(/submission-(\d+)/)?.[1] ?? -1));

export function GithubSubmissions({ problemId, onReviewSyntaxIssue }: { problemId: string; onReviewSyntaxIssue?: (issue: DetectedSyntaxIssue) => void }) {
  const { cache } = useGithubSync();
  const [openId, setOpenId] = useState<string>();
  const submissions = ordered(cache.submissions.filter((submission) => submission.problemId === problemId));
  const possibleIssues = cache.comparisons.flatMap((comparison) => {
    const target = cache.submissions.find((submission) => submission.id === comparison.toSubmissionId);
    return target?.problemId === problemId ? comparison.detectedSyntaxIssues ?? [] : [];
  });
  if (!submissions.length && !possibleIssues.length) return null;
  return <section className="panel mt-5 p-5 sm:p-7"><div className="flex items-center gap-2"><Github size={18} className="text-slate-400" /><div><p className="subtle-label">GitHub</p><h3 className="mt-1 text-lg font-semibold text-slate-100">GitHub Submissions</h3></div></div>{submissions.length > 0 && <div className="mt-5 space-y-2">{submissions.map((submission, index) => <div key={submission.id} className="rounded-xl border border-slate-800 bg-slate-950/30"><button type="button" onClick={() => setOpenId(openId === submission.id ? undefined : submission.id)} className="flex w-full items-center justify-between gap-3 p-3.5 text-left"><span><span className="block font-medium text-slate-200">Submission {submissions.length - index}{index === 0 && <span className="ml-2 rounded-full bg-cyan-300/10 px-2 py-0.5 text-xs text-cyan-200">Latest</span>}</span><span className="mt-1 block text-xs text-slate-500">{submission.language} · {submission.filename}</span></span><ChevronDown size={17} className={`text-slate-500 transition ${openId === submission.id ? "rotate-180" : ""}`} /></button>{openId === submission.id && <div className="border-t border-slate-800 p-3.5"><p className="mb-2 inline-flex items-center gap-1.5 text-xs text-slate-500"><Braces size={13} />Read-only source code</p><pre className="max-h-96 overflow-auto rounded-lg bg-[#080d18] p-3 text-xs leading-5 text-slate-300"><code>{submission.sourceCode}</code></pre></div>}</div>)}</div>}{possibleIssues.length > 0 && <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4"><p className="text-sm font-semibold text-amber-200">Auto-detected possible syntax correction</p>{possibleIssues.map((issue) => <div key={`${issue.syntaxId}-${issue.incorrectText}`} className="mt-3"><p className="text-sm text-slate-300"><code className="text-amber-100">{issue.incorrectText}</code> → <code className="text-cyan-100">{issue.correctedText}</code> <span className="text-xs text-slate-500">({issue.confidence} confidence; verify before treating as a mistake)</span></p>{onReviewSyntaxIssue && <button type="button" onClick={() => onReviewSyntaxIssue(issue)} className="mt-2 text-sm font-semibold text-amber-100 hover:text-amber-50">Review in Performance Details</button>}</div>)}</div>}</section>;
}
