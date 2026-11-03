import { Loader2, AlertCircle } from "lucide-react";
import { tone } from "../utils.js";

export const Spinner = ({ label = "Loading" }) => (
  <div className="flex items-center justify-center gap-2 py-20 text-ink-mute" role="status">
    <Loader2 className="animate-spin" size={20} /> {label}
  </div>
);

export const ErrorBox = ({ message, onRetry }) => (
  <div className="flex items-start gap-3 rounded-xl border border-coral/30 bg-coral-tint p-4 text-sm text-coral" role="alert">
    <AlertCircle size={18} className="mt-0.5 shrink-0" />
    <div className="flex-1">{message}</div>
    {onRetry && <button onClick={onRetry} className="font-semibold underline">Try again</button>}
  </div>
);

export const ScoreBar = ({ label, value, max = 100 }) => {
  const pct = Math.round((value / max) * 100);
  const t = tone(pct);
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-ink-mute">{label}</span>
        <span className="font-semibold">{max === 10 ? `${value}/10` : value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-canvas">
        <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${pct}%`, transition: "width .6s ease" }} />
      </div>
    </div>
  );
};

export const ScorePill = ({ score }) => {
  const t = tone(score);
  return <span className={`chip ${t.bg} ${t.text}`}>{score}</span>;
};

export const PageHeader = ({ title, children, sub }) => (
  <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
      {sub && <p className="mt-2 max-w-xl text-ink-mute">{sub}</p>}
    </div>
    {children}
  </div>
);
