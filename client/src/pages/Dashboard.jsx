import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mic, Trophy, Target, TrendingUp, ClipboardCheck, ChevronRight, ArrowUpRight, Sparkles } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api.js";
import { Spinner, ErrorBox, ScorePill } from "../components/ui.jsx";
import { fmtDate, greeting, tone, cap } from "../utils.js";

function Tile({ icon: Icon, label, value, hint }) {
  return (
    <div className="panel group p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-ink-mute">{label}</div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cobalt-tint text-cobalt transition-colors group-hover:bg-cobalt group-hover:text-white"><Icon size={17} /></span>
      </div>
      <div className="mt-4 font-display text-3xl font-bold tracking-tight">{value}</div>
      {hint && <div className="mt-1 truncate text-xs text-ink-faint">{hint}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const load = () => {
    setError("");
    api.stats().then(setStats).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  if (error) return <ErrorBox message={error} onRetry={load} />;
  if (!stats) return <Spinner label="Loading your dashboard" />;

  const empty = stats.totalInterviews === 0;

  return (
    <div>
      <section className="dashboard-hero relative isolate mb-7 overflow-hidden rounded-[1.75rem] p-6 text-white shadow-lg sm:p-9">
        <div className="pointer-events-none absolute -right-14 -top-20 -z-10 h-64 w-64 rounded-full border border-white/10 sm:h-80 sm:w-80" />
        <div className="pointer-events-none absolute -right-2 -top-8 -z-10 h-40 w-40 rounded-full border border-white/10 sm:h-56 sm:w-56" />
        <div className="relative flex flex-wrap items-end justify-between gap-7">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-white/90">
              <Sparkles size={14} /> YOUR PERSONAL PRACTICE SPACE
            </div>
            <h1 className="text-3xl font-bold leading-tight sm:text-[2.6rem]">{greeting()}. Ready for a practice round?</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
            {empty
              ? "Pick a language, answer out loud, and get scored feedback on every answer."
              : `You've completed ${stats.totalInterviews} interview${stats.totalInterviews > 1 ? "s" : ""}. ${
                  stats.weakest ? `${stats.weakest.topic} is your next best topic to practise.` : "Keep the streak going."
                }`}
            </p>
          </div>
          <Link to="/setup" className="btn inline-flex bg-white px-5 py-3 text-sm font-bold text-ink shadow-lg hover:-translate-y-0.5 hover:bg-cobalt-tint">
            <Mic size={17} /> Start an interview <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tile icon={ClipboardCheck} label="Interviews done" value={stats.totalInterviews} hint={stats.inProgress ? `${stats.inProgress} in progress` : "None in progress"} />
        <Tile icon={TrendingUp} label="Average score" value={empty ? "-" : `${stats.averageScore}`} hint={empty ? "Finish one to see this" : `Best: ${stats.bestScore}`} />
        <Tile icon={Trophy} label="Strongest topic" value={stats.strongest?.topic || "-"} hint={stats.strongest ? `${stats.strongest.score}/100 average` : "No data yet"} />
        <Tile icon={Target} label="Weakest topic" value={stats.weakest?.topic || "-"} hint={stats.weakest ? `${stats.weakest.score}/100 average` : "No data yet"} />
      </div>

      {empty ? (
        <div className="panel mt-6 flex flex-col items-center px-5 py-10 text-center sm:py-12">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cobalt-tint text-cobalt"><TrendingUp size={22} /></div>
          <h2 className="text-xl font-bold">Your progress starts with one session</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-mute">
            Complete your first interview and you'll see score trends, topic strengths and a personal study plan.
          </p>
          <Link to="/setup" className="btn-primary mt-5">Set up your first interview <ArrowUpRight size={16} /></Link>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            <section className="panel p-6 lg:col-span-3" aria-label="Score trend">
              <h2 className="text-lg font-bold">Score over time</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer>
                  <AreaChart data={stats.trend.map((t, i) => ({ ...t, n: `#${i + 1}` }))}>
                    <defs>
                      <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2B4BF2" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#2B4BF2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#E1E5EE" vertical={false} />
                    <XAxis dataKey="n" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} width={30} />
                    <Tooltip formatter={(v) => [`${v}/100`, "Score"]} labelFormatter={(l, p) => p?.[0] ? `${p[0].payload.language} - ${fmtDate(p[0].payload.date)}` : l} />
                    <Area type="monotone" dataKey="score" stroke="#2B4BF2" strokeWidth={2.5} fill="url(#g)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="panel p-6 lg:col-span-2" aria-label="Topic performance">
              <h2 className="text-lg font-bold">Topic performance</h2>
              <div className="mt-4" style={{ height: Math.max(180, stats.topics.length * 34) }}>
                <ResponsiveContainer>
                  <BarChart data={stats.topics} layout="vertical" margin={{ left: 0, right: 12 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="topic" width={110} tickLine={false} axisLine={false} fontSize={12} />
                    <Tooltip formatter={(v) => [`${v}/100`, "Average"]} cursor={{ fill: "#F3F5F9" }} />
                    <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={16}>
                      {stats.topics.map((t) => <Cell key={t.topic} fill={tone(t.score).hex} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="panel mt-6 p-6" aria-label="Recent interviews">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Recent interviews</h2>
              <Link to="/history" className="text-sm font-semibold text-cobalt">View all</Link>
            </div>
            <ul className="divide-y divide-line">
              {stats.recent.map((r) => (
                <li key={r.sessionId}>
                  <Link to={`/report/${r.sessionId}`} className="flex items-center gap-4 py-3 hover:text-cobalt">
                    <div className="flex-1">
                      <div className="font-medium">{r.language} - {r.type}</div>
                      <div className="text-xs text-ink-faint">{cap(r.difficulty)} - {fmtDate(r.finishedAt)}</div>
                    </div>
                    <ScorePill score={r.overall} />
                    <ChevronRight size={16} className="text-ink-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
