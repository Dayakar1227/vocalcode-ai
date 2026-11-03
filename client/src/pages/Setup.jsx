import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2, Mic, MicOff, Check, Clock3, ShieldCheck } from "lucide-react";
import { api } from "../api.js";
import { ErrorBox, PageHeader } from "../components/ui.jsx";

const SECTIONS = [
  { key: "language", title: "Programming language", options: [
    { v: "Java", d: "OOP, collections, exceptions" },
    { v: "Python", d: "Data structures, generators, OOP" },
    { v: "JavaScript", d: "Closures, async, the event loop" },
  ] },
  { key: "difficulty", title: "Difficulty", options: [
    { v: "beginner", d: "Core concepts and definitions" },
    { v: "intermediate", d: "Trade-offs and examples" },
    { v: "advanced", d: "Internals and edge cases" },
  ] },
  { key: "type", title: "Interview type", options: [
    { v: "Technical", d: "General language knowledge" },
    { v: "OOP", d: "Object-oriented design" },
    { v: "DSA", d: "Data structures and algorithms" },
    { v: "Coding", d: "Write and run code for challenges" },
  ] },
  { key: "total", title: "Number of questions", options: [
    { v: 3, d: "Quick, about 5 min" },
    { v: 5, d: "Standard, about 10 min" },
    { v: 10, d: "Full, about 20 min" },
  ] },
];

const label = (v) => (typeof v === "number" ? `${v} questions` : v.charAt(0).toUpperCase() + v.slice(1));

export default function Setup() {
  const nav = useNavigate();
  const [cfg, setCfg] = useState({ language: "Java", difficulty: "intermediate", type: "Technical", total: 5 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraConsent, setCameraConsent] = useState(false);
  const micOk = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const start = async () => {
    setLoading(true);
    setError("");
    try {
      if (!cameraConsent) throw new Error("Please confirm camera use to start an interview.");
      const camera = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      camera.getTracks().forEach((track) => track.stop());
      // Prompt for mic permission up front so the interview itself isn't interrupted
      try {
        const s = await navigator.mediaDevices?.getUserMedia({ audio: true });
        s?.getTracks().forEach((t) => t.stop());
      } catch { /* user can still type answers */ }
      const s = await api.start(cfg);
      nav(`/interview/${s.sessionId}`);
    } catch (e) {
      setError(e.name === "NotAllowedError"
        ? "Camera access is required. Allow it in your browser’s address bar, then try again."
        : e.message || "Could not start the camera. Check the browser permission and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Set up your interview" sub="Build a focused practice session. Your interviewer adapts its follow-ups as you answer." />

      {!micOk && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber/30 bg-amber-tint p-4 text-sm text-amber">
          <MicOff size={18} className="mt-0.5 shrink-0" />
          This browser doesn't support speech recognition. Open the app in Chrome or Edge to answer by voice. You can still type answers here.
        </div>
      )}

      <section className="panel mb-8 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cobalt-tint text-cobalt"><Camera size={19} /></span>
          <div>
            <h2 className="font-semibold">Camera and privacy</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-mute">
              A small preview and basic face-presence checks run on this device. Video is not recorded, saved, or sent. These checks can be inaccurate and do not determine cheating.
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-canvas/60 p-3 text-sm text-ink-soft transition-colors hover:bg-canvas">
              <input
                type="checkbox"
                checked={cameraConsent}
                onChange={(e) => setCameraConsent(e.target.checked)}
                className="mt-0.5 accent-cobalt"
              />
              I understand and agree to enable my camera during this practice interview.
            </label>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        {SECTIONS.map((sec) => (
          <fieldset key={sec.key} className="panel p-5 sm:p-6">
            <legend className="mb-4 px-1 text-base font-semibold text-ink">{sec.title}</legend>
            <div className={`grid gap-3 ${sec.key === "type" ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              {sec.options.map((o) => {
                const active = cfg[sec.key] === o.v;
                return (
                  <label key={o.v}
                    className={`relative cursor-pointer rounded-2xl border p-4 transition-all focus-within:outline focus-within:outline-2 focus-within:outline-cobalt ${
                      active ? "border-cobalt bg-cobalt-tint/70 shadow-sm" : "border-line bg-white hover:-translate-y-0.5 hover:border-cobalt/40 hover:shadow-sm"}`}>
                    <input type="radio" name={sec.key} className="sr-only" checked={active}
                      onChange={() => setCfg({ ...cfg, [sec.key]: o.v })} />
                    <div className="flex items-start justify-between gap-2">
                      <div className={`font-semibold ${active ? "text-cobalt" : ""}`}>{label(o.v)}</div>
                      {active && <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cobalt text-white"><Check size={12} strokeWidth={3} /></span>}
                    </div>
                    <div className="mt-1 text-xs leading-relaxed text-ink-mute">{o.d}</div>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error && <div className="mt-6"><ErrorBox message={error} /></div>}

      <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-panel sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink-faint">SESSION SUMMARY</p>
          <p className="mt-1 font-semibold text-ink">{cfg.language} <span className="text-ink-faint">·</span> {label(cfg.difficulty)} <span className="text-ink-faint">·</span> {cfg.type}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-mute"><Clock3 size={13} /> {cfg.total} questions <span className="mx-1 text-line">|</span><ShieldCheck size={13} /> Private practice</p>
        </div>
        <button className="btn-primary w-full sm:w-auto sm:px-6 sm:py-3" onClick={start} disabled={loading}>
          {loading ? <><Loader2 size={16} className="animate-spin" /> Preparing question</> : <><Mic size={16} /> Start interview</>}
        </button>
      </div>
    </div>
  );
}
