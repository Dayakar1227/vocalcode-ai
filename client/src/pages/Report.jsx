import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CheckCircle2, Clock, ListChecks, Mic, Printer, Square, Volume2, HelpCircle } from "lucide-react";
import { api } from "../api.js";
import { useVoice } from "../hooks/useVoice.js";
import ScoreRing from "../components/ScoreRing.jsx";
import { ErrorBox, PageHeader, ScoreBar, ScorePill, Spinner } from "../components/ui.jsx";
import { cap, fmtDate, fmtDuration, tone } from "../utils.js";

export default function Report() {
  const { id } = useParams();
  const { state } = useLocation();
  const v = useVoice();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.report(id).then((d) => {
      setData(d);
      if (state?.fresh) setTimeout(() => v.speak(`${d.report.spokenSummary} ${d.questions.map((q, i) => {
        const feedback = q.evaluation?.feedback || "";
        if (d.config.type === "Coding") {
          return `Challenge ${i + 1}. ${feedback} Review the model solution shown on screen.`;
        }
        const correction = q.evaluation?.idealAnswer
          ? `A stronger answer would be: ${q.evaluation.idealAnswer}`
          : "";
        return `Question ${i + 1}. ${feedback} ${correction}`;
      }).join(" ")}`), 400);
    }).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <ErrorBox message={error} />;
  if (!data) return <Spinner label="Loading report" />;

  const { report: r, config, questions } = data;
  const questionNarration = (question, index) => {
    const feedback = question.evaluation?.feedback || "No detailed feedback is available.";
    if (config.type === "Coding") {
      return `Challenge ${index + 1}. ${feedback} Review the model solution shown on screen.`;
    }
    const correction = question.evaluation?.idealAnswer
      ? `A stronger answer would be: ${question.evaluation.idealAnswer}`
      : "";
    return `Question ${index + 1}. ${feedback} ${correction}`;
  };
  const fullReportSpeech = `${r.spokenSummary} Question-by-question feedback. ${
    questions.map(questionNarration).join(" ")
  }`;
  const t = tone(r.overall);
  const strip = (s) => String(s).replace(/^\d+[.)]\s*/, "");

  return (
    <div>
      <PageHeader title="Interview report" sub={`${config.language} - ${config.type} - ${cap(config.difficulty)} - ${fmtDate(data.finishedAt)}`}>
        <div className="no-print flex flex-wrap gap-2">
          {v.speaking
            ? <button className="btn-ghost" onClick={v.stopSpeaking}><Square size={14} /> Stop</button>
            : <button className="btn-ghost" onClick={() => v.speak(fullReportSpeech)}><Volume2 size={16} /> Listen to full review</button>}
          <button className="btn-ghost" onClick={() => window.print()}><Printer size={16} /> Print</button>
          <Link to="/setup" className="btn-primary"><Mic size={16} /> New interview</Link>
        </div>
      </PageHeader>

      <section className="panel grid gap-8 p-6 sm:p-8 md:grid-cols-[auto_1fr_1fr]">
        <div className="flex flex-col items-center gap-3">
          <ScoreRing value={r.overall} size={150} />
          <span className={`chip ${t.bg} ${t.text}`}>{t.label}</span>
        </div>
        <div>
          <h2 className="text-lg font-bold">Summary</h2>
          <p className="mt-2 leading-relaxed text-ink-soft">{r.summary}</p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink-mute">
            <span className="flex items-center gap-1.5"><ListChecks size={14} /> {r.questionsAnswered} answers</span>
            <span className="flex items-center gap-1.5"><Clock size={14} /> {fmtDuration(r.durationSec)}</span>
          </div>
        </div>
        <div className="space-y-4">
          <ScoreBar label="Correctness" value={r.correctness} />
          <ScoreBar label="Conceptual understanding" value={r.conceptual} />
          <ScoreBar label="Communication clarity" value={r.clarity} />
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="panel p-6 lg:col-span-3">
          <h2 className="text-lg font-bold">Topic-wise performance</h2>
          <div className="mt-4" style={{ height: Math.max(200, r.topicScores.length * 42) }}>
            <ResponsiveContainer>
              <BarChart data={r.topicScores} layout="vertical" margin={{ right: 16 }}>
                <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} />
                <YAxis type="category" dataKey="topic" width={120} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip formatter={(v2) => [`${v2}/100`, "Score"]} cursor={{ fill: "#F3F5F9" }} />
                <Bar dataKey="score" barSize={18} radius={[0, 6, 6, 0]}>
                  {r.topicScores.map((x) => <Cell key={x.topic} fill={tone(x.score).hex} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="space-y-6 lg:col-span-2">
          <section className="panel p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold"><CheckCircle2 size={18} className="text-mint" /> Strengths</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {r.strengths.length ? r.strengths.map((s, i) => <li key={i}>{s}</li>) : <li className="text-ink-faint">Keep practising to build clear strengths.</li>}
            </ul>
          </section>
          <section className="panel p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold"><AlertTriangle size={18} className="text-amber" /> Areas to improve</h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              {r.weaknesses.length ? r.weaknesses.map((s, i) => <li key={i}>{s}</li>) : <li className="text-ink-faint">No major gaps found.</li>}
            </ul>
            {r.weakTopics.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {r.weakTopics.map((w) => <span key={w} className="chip bg-coral-tint text-coral">{w}</span>)}
              </div>
            )}
          </section>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-lg font-bold">Your study plan</h2>
          <ol className="mt-4 space-y-3">
            {r.studyPlan.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cobalt-tint text-xs font-bold text-cobalt">{i + 1}</span>
                <span className="pt-0.5 text-ink-soft">{strip(s)}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className="panel p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold"><HelpCircle size={18} /> Practice questions for you</h2>
          <ul className="mt-4 space-y-3">
            {r.practiceQuestions.map((p, i) => (
              <li key={i} className="rounded-xl bg-canvas p-3 text-sm">
                <div className="mb-1 flex items-center gap-2 text-xs text-ink-mute">
                  <span className="font-semibold">{p.topic}</span>
                  {p.level && <span className="chip bg-white text-ink-mute">{p.level}</span>}
                </div>
                {p.question}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="panel mt-6 p-6">
        <h2 className="text-lg font-bold">Question by question corrections</h2>
        <div className="mt-4 divide-y divide-line">
          {questions.map((q, i) => (
            <details key={i} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{q.text}</div>
                  <div className="text-xs text-ink-faint">{q.topic}{q.isFollowUp && " - follow-up"}</div>
                </div>
                <ScorePill score={q.evaluation?.score ?? 0} />
              </summary>
              <div className="mt-3 space-y-3 pl-1 text-sm">
                <button className="btn-ghost no-print" onClick={() => v.speak(questionNarration(q, i))}>
                  <Volume2 size={14} /> Listen to this feedback
                </button>
                <div><div className="text-xs font-semibold text-ink-mute">Your answer</div><p className="mt-1 text-ink-soft">{q.answer}</p></div>
                <div><div className="text-xs font-semibold text-ink-mute">Feedback</div><p className="mt-1 text-ink-soft">{q.evaluation?.feedback}</p></div>
                {q.evaluation?.idealAnswer && <div><div className="text-xs font-semibold text-ink-mute">A strong answer</div><p className="mt-1 text-ink-soft">{q.evaluation.idealAnswer}</p></div>}
                {q.evaluation?.missingConcepts?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">{q.evaluation.missingConcepts.map((m) => <span key={m} className="chip bg-amber-tint text-amber">{m}</span>)}</div>
                )}
              </div>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
