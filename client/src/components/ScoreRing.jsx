import { tone } from "../utils.js";

export default function ScoreRing({ value = 0, size = 132, stroke = 12, label = "/ 100" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const t = tone(value);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Score ${value} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E1E5EE" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.hex} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold leading-none">{value}</span>
        <span className="mt-1 text-xs text-ink-faint">{label}</span>
      </div>
    </div>
  );
}
