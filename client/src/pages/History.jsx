import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Play } from "lucide-react";
import { api } from "../api.js";
import { Spinner, ErrorBox, ScorePill, PageHeader } from "../components/ui.jsx";
import { fmtDate, cap } from "../utils.js";

export default function History() {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");

  const load = () => api.list().then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this interview? This can't be undone.")) return;
    try { await api.remove(id); setList((l) => l.filter((x) => x.sessionId !== id)); }
    catch (e) { setError(e.message); }
  };

  if (error) return <ErrorBox message={error} onRetry={() => { setError(""); load(); }} />;
  if (!list) return <Spinner label="Loading history" />;

  return (
    <div>
      <PageHeader title="Interview history" sub="Every session is saved so you can review answers and track progress." />
      {list.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-ink-mute">No interviews yet.</p>
          <Link to="/setup" className="btn-primary mt-4">Start your first interview</Link>
        </div>
      ) : (
        <div className="panel divide-y divide-line">
          {list.map((s) => (
            <div key={s.sessionId} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-[180px] flex-1">
                <div className="font-medium">{s.config.language} - {s.config.type}</div>
                <div className="text-xs text-ink-faint">{cap(s.config.difficulty)} - {s.answered} answered - {fmtDate(s.createdAt)}</div>
              </div>
              {s.status === "completed" ? (
                <>
                  <ScorePill score={s.overall} />
                  <Link to={`/report/${s.sessionId}`} className="btn-ghost">View report</Link>
                </>
              ) : (
                <>
                  <span className="chip bg-amber-tint text-amber">In progress</span>
                  <Link to={`/interview/${s.sessionId}`} className="btn-ghost"><Play size={14} /> Resume</Link>
                </>
              )}
              <button onClick={() => remove(s.sessionId)} aria-label="Delete interview" className="rounded-lg p-2 text-ink-faint hover:bg-coral-tint hover:text-coral">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
