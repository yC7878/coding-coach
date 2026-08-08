interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className = "" }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 overflow-hidden rounded-full bg-slate-800 ${className}`} role="progressbar" aria-valuenow={safeValue} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300" style={{ width: `${safeValue}%` }} />
    </div>
  );
}
