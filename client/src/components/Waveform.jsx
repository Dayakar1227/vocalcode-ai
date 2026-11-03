const BARS = 40;

// state: "idle" | "listening" | "speaking"
export default function Waveform({ state = "idle" }) {
  const cls = state === "listening" ? "wave-live" : state === "speaking" ? "wave-speaking" : "";
  const color = state === "listening" ? "#FFFFFF" : state === "speaking" ? "#8FA3FF" : "#4A5168";
  return (
    <div className={`flex h-20 items-center justify-center gap-[3px] ${cls}`} aria-hidden="true">
      {Array.from({ length: BARS }).map((_, i) => (
        <span
          key={i}
          className="wave-bar block w-[3px] rounded-full"
          style={{
            height: `${28 + ((i * 37) % 68)}%`,
            background: color,
            animationDelay: `${(i % 10) * 0.09}s`,
            animationDuration: `${0.8 + (i % 7) * 0.09}s`,
          }}
        />
      ))}
    </div>
  );
}
