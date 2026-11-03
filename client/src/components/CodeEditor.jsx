import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { api } from "../api.js";
import { ErrorBox } from "./ui.jsx";

export default function CodeEditor({ language, code, onChange, label = "Run code" }) {
  const [stdin, setStdin] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      setResult(await api.runCode(language, code, stdin));
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-3">
      <label htmlFor="code-editor" className="text-sm font-semibold">Your code ({language})</label>
      <textarea
        id="code-editor"
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck="false"
        autoCapitalize="off"
        autoCorrect="off"
        className="min-h-72 w-full resize-y rounded-xl border border-line bg-[#111827] p-4 font-mono text-sm leading-relaxed text-white placeholder:text-white/40 focus:border-cobalt focus:outline-none"
        aria-label={`${language} code editor`}
      />
      <label htmlFor="code-input" className="block text-xs font-semibold text-ink-mute">Program input (optional)</label>
      <textarea
        id="code-input"
        rows={2}
        value={stdin}
        onChange={(e) => setStdin(e.target.value)}
        className="w-full rounded-xl border border-line bg-canvas p-3 font-mono text-sm"
        placeholder="Input passed to stdin"
      />
      <button className="btn-primary" onClick={run} disabled={running || !code.trim()}>
        {running ? <><Loader2 size={16} className="animate-spin" /> Running</> : <><Play size={16} /> {label}</>}
      </button>
      {error && <ErrorBox message={error} />}
      {error.includes("JDOODLE_CLIENT_ID") && (
        <div className="rounded-xl border border-amber/30 bg-amber-tint p-4 text-sm text-amber">
          <a
            href="https://www.jdoodle.com/compiler-api/"
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline"
          >
            Get free JDoodle API credentials
          </a>
          <p className="mt-2">
            Create a free JDoodle Compiler API account, then add your client ID and secret to <code>server/.env</code> as <code>JDOODLE_CLIENT_ID</code> and <code>JDOODLE_CLIENT_SECRET</code>. Restart the API. Keep both values private; don’t paste them into chat or the code editor.
          </p>
        </div>
      )}
      {result && (
        <section className="rounded-xl border border-line bg-canvas p-4" aria-live="polite">
          <div className="flex flex-wrap justify-between gap-2 text-sm">
            <strong>Result: {result.status}</strong>
            <span className="text-ink-mute">
              {result.time ? `${result.time}s` : ""}
              {result.memory ? ` · ${result.memory} KB` : ""}
            </span>
          </div>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-sm">
            {result.output || "(no output)"}
          </pre>
        </section>
      )}
      <p className="text-xs text-ink-faint">
        Code is sent to JDoodle to execute (free plan: 20 runs per day). Don’t include passwords, API keys, or other secrets.
      </p>
    </div>
  );
}
