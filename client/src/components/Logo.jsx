export default function Logo({ dark = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="#2B4BF2" />
        <g fill="#fff">
          <rect x="7" y="13" width="3" height="6" rx="1.5" />
          <rect x="12" y="8" width="3" height="16" rx="1.5" />
          <rect x="17" y="11" width="3" height="10" rx="1.5" />
          <rect x="22" y="14" width="3" height="4" rx="1.5" />
        </g>
      </svg>
      <span className={`font-display text-lg font-bold ${dark ? "text-white" : "text-ink"}`}>VocalCode AI</span>
    </div>
  );
}
