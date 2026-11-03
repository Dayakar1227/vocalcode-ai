import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight, Brain, CheckCircle2, Flag, Loader2, Mic, MicOff, RefreshCw, Send, Sparkles, Square, Volume2, VolumeX, Target, Gauge, MessageSquareQuote,
} from "lucide-react";
import { api } from "../api.js";
import { useVoice } from "../hooks/useVoice.js";
import CameraMonitor, { CameraStatus } from "../components/CameraMonitor.jsx";
import CodeEditor from "../components/CodeEditor.jsx";
import Waveform from "../components/Waveform.jsx";
import { ErrorBox, ScoreBar, ScorePill, Spinner } from "../components/ui.jsx";
import { cap } from "../utils.js";

export default function Interview() {
  const { id } = useParams();
  const nav = useNavigate();
  const v = useVoice();
  const [cameraState, setCameraState] = useState({ state: "loading", warning: "" });
  const [cameraAttempt, setCameraAttempt] = useState(0);
  const [code, setCode] = useState("");
  const [manualVoice, setManualVoice] = useState(!v.supported);
  const manualVoiceRef = useRef(manualVoice);
  const autoSubmitRef = useRef(null);
  const submittingRef = useRef(false);
  const finishingRef = useRef(false);
  const feedbackDoneRef = useRef(null);
  manualVoiceRef.current = manualVoice;

  const [session, setSession] = useState(null);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [lastEval, setLastEval] = useState(null);
  const [result, setResult] = useState(null); // last orchestrator result
  const [phase, setPhase] = useState("loading"); // loading | question | evaluating | feedback | finishing
  const [progress, setProgress] = useState({ answered: 0, total: 5 });
  const [difficulty, setDifficulty] = useState("");
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(false);

  // Load or resume
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await api.get(id);
        if (!alive) return;
        if (s.status === "completed") return nav(`/report/${id}`, { replace: true });
        setSession(s);
        setProgress(s.progress);
        setDifficulty(s.currentDifficulty);
        const answered = s.questions.filter((q) => q.answer);
        setHistory(answered.map((q) => ({ topic: q.topic, text: q.text, score: q.evaluation?.score, isFollowUp: q.isFollowUp })));
        if (answered.length) setLastEval(answered.at(-1).evaluation);
        const open = s.questions.find((q) => !q.answer);
        if (open) { setCurrent(open); setPhase("question"); return; }
        const r = await api.question(id);
        if (!alive) return;
        if (r.done) { setResult({ done: true, next: null }); setPhase("feedback"); }
        else { setCurrent(r.question); setPhase("question"); }
      } catch (e) {
        if (alive) setError(e.message);
      }
    })();
    return () => { alive = false; };
  }, [id, nav]);

  useEffect(() => {
    if (v.error && v.supported) setManualVoice(true);
  }, [v.error, v.supported]);

  useEffect(() => {
    if (current && session?.config.type === "Coding") {
      const starters = {
        Java: "class Main {\n  public static void main(String[] args) {\n    // Write your solution here\n  }\n}",
        Python: "def solve():\n    # Write your solution here\n    pass\n\nsolve()",
        JavaScript: "function solve() {\n  // Write your solution here\n}\n\nsolve();",
      };
      setCode(starters[session.config.language] || "");
    }
  }, [current?.id, session?.config.language, session?.config.type]);

  const toggleMute = () => {
    const nextMuted = !muted;
    v.setMuted(nextMuted);
    setMuted(nextMuted);
    if (nextMuted && phase === "question" && v.speaking && !isCoding) {
      startListening();
    } else if (nextMuted && phase === "feedback") {
      feedbackDoneRef.current?.();
    }
  };

  const advance = (next) => {
    feedbackDoneRef.current = null;
    submittingRef.current = false;
    v.stopSpeaking();
    v.setText("");
    setCode("");
    setCurrent(next);
    setPhase("question");
  };

  const finish = async (failurePhase = phase) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    v.stop();
    v.stopSpeaking();
    setError("");
    const back = phase;
    setPhase("finishing");
    try {
      await api.finish(id);
      nav(`/report/${id}`, { state: { fresh: true } });
    } catch (e) {
      setError(e.message);
      setPhase(failurePhase === "finishing" ? back : failurePhase);
      submittingRef.current = false;
      finishingRef.current = false;
    }
  };

  const submit = async (spokenAnswer, automatic = false) => {
    if (submittingRef.current || finishingRef.current) return;
    const answer = (session?.config.type === "Coding" ? code : spokenAnswer ?? v.text).trim();
    if (answer.length < 3) return setError("Say or type your answer first.");
    if (cameraState.state !== "ready") return setError("Camera access and local checks are required to continue.");
    submittingRef.current = true;
    v.stop();
    setError("");
    setPhase("evaluating");
    try {
      const res = await api.answer(id, answer);
      setResult(res);
      setLastEval(res.evaluation);
      setProgress(res.progress);
      setDifficulty(res.plan.nextDifficulty);
      setHistory((h) => [...h, { topic: current.topic, text: current.text, score: res.evaluation.score, isFollowUp: current.isFollowUp }]);
      setPhase("feedback");
      const tail = res.next ? (res.next.isFollowUp ? "I have a follow-up for you." : "Let's move on.") : "That was the last question.";
      const correction = session.config.type === "Coding"
        ? "Your model solution is available in the interview review."
        : res.evaluation.idealAnswer ? `A strong answer would be: ${res.evaluation.idealAnswer}` : "";
      const shouldFinish = !res.next;
      submittingRef.current = shouldFinish;
      const shouldContinue = automatic || shouldFinish;
      const completeFeedback = shouldContinue
        ? () => {
          if (feedbackDoneRef.current !== completeFeedback) return;
          feedbackDoneRef.current = null;
          if (res.next) advance(res.next);
          else finish("feedback");
        }
        : null;
      feedbackDoneRef.current = completeFeedback;
      v.speak(
        `${res.evaluation.feedback} ${correction} ${tail}`,
        completeFeedback || undefined
      );
    } catch (e) {
      submittingRef.current = false;
      setError(e.message);
      if (automatic) setManualVoice(true);
      setPhase("question");
    }
  };

  autoSubmitRef.current = (answer) => submit(answer, true);

  const startListening = () => {
    if (!v.supported) {
      setManualVoice(true);
      return;
    }
    if (v.error) v.setError("");
    const started = v.start(manualVoice ? {} : {
      silenceMs: 4000,
      onSilence: (answer) => autoSubmitRef.current?.(answer),
    });
    if (!started) setManualVoice(true);
  };

  // Ask the question, then listen continuously and submit after four seconds of silence.
  useEffect(() => {
    if (phase !== "question" || !current || session?.config.type === "Coding" || cameraState.state !== "ready") return;
    const onQuestionEnd = () => {
      if (!manualVoiceRef.current) startListening();
    };
    v.speak(current.text, onQuestionEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, phase, cameraState.state, session?.config.type]);

  const interruptAndAnswer = () => {
    v.stopSpeaking();
    startListening();
  };

  const replayQuestion = () => {
    if (v.listening) v.stop();
    v.speak(current.text, () => {
      if (!manualVoice) startListening();
    });
  };

  const proceed = () => advance(result.next);

  const endEarly = () => {
    if (window.confirm("End the interview now and generate your report?")) finish(phase);
  };

  const pct = Math.round((progress.answered / progress.total) * 100);
  const voiceState = v.listening ? "listening" : v.speaking ? "speaking" : "idle";
  const plan = result?.plan;
  const isCoding = session?.config.type === "Coding";
  const autoVoice = !isCoding && !manualVoice && v.supported;
  const replayFeedback = () => {
    const correction = isCoding
      ? "Your model solution is available in the interview review."
      : lastEval?.idealAnswer ? `A strong answer would be: ${lastEval.idealAnswer}` : "";
    v.speak(`${lastEval?.feedback || ""} ${correction}`, feedbackDoneRef.current || undefined);
  };

  if (phase === "loading") {
    return <div className="mx-auto max-w-xl">{error ? <ErrorBox message={error} /> : <Spinner label="Preparing your interview" />}</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* LEFT: voice stage */}
      <div className="min-w-0 space-y-4">
        <section className="rounded-3xl bg-ink p-6 text-white sm:p-8" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip bg-white/10 text-white">{session.config.language}</span>
            <span className="chip bg-white/10 text-white">{current?.topic || "Interview"}</span>
            {current?.isFollowUp && <span className="chip bg-amber text-white"><Sparkles size={12} /> Follow-up</span>}
            <span className="ml-auto text-sm text-white/60">
              Question {Math.min(progress.answered + (phase === "feedback" || phase === "finishing" ? 0 : 1), progress.total)} of {progress.total}
            </span>
          </div>

          {phase === "feedback" || phase === "finishing" ? (
            <div className="py-10 text-center">
              {phase === "finishing" ? (
                <>
                  <Loader2 className="mx-auto animate-spin" size={32} />
                  <h2 className="mt-4 text-2xl font-bold">Building your report</h2>
                  <p className="mt-1 text-white/60">Scoring topics and writing your study plan.</p>
                </>
              ) : (
                <>
                  <CheckCircle2 className="mx-auto text-mint" size={36} />
                  <h2 className="mt-4 text-2xl font-bold">Answer evaluated</h2>
                  <p className="mx-auto mt-2 max-w-md text-white/70">
                    {result?.next
                      ? result.next.isFollowUp
                        ? "Your interviewer has a follow-up question for you."
                        : "Ready for the next topic when you are."
                      : "That was the final question. Your report is ready to build."}
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {autoVoice ? (
                      <p className="self-center text-sm text-white/60" role="status">Continuing automatically after the spoken feedback.</p>
                    ) : result?.next ? (
                      <button className="btn-primary" onClick={proceed}>
                        {result.next.isFollowUp ? "Answer follow-up" : "Next question"} <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button className="btn-primary" onClick={finish}><Flag size={16} /> Generate report</button>
                    )}
                    <button className="btn-dark" onClick={replayFeedback}><Volume2 size={16} /> Replay feedback</button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="mt-6 flex items-start gap-3 sm:gap-5">
                <h2 className="min-w-0 flex-1 text-xl font-bold leading-snug sm:text-3xl">{current?.text}</h2>
                <CameraMonitor key={cameraAttempt} compact onStateChange={setCameraState} />
              </div>
              <CameraStatus status={cameraState} onRetry={() => {
                setCameraState({ state: "loading", warning: "" });
                setCameraAttempt((n) => n + 1);
              }} />
              {current?.followUpReason && <p className="mt-2 text-sm text-white/60">Why this question: {current.followUpReason}</p>}

              <div className="mt-6"><Waveform state={voiceState} /></div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {!isCoding && !manualVoice ? (
                  <>
                    <span className="chip bg-white/10 text-white" role="status">
                      {v.speaking ? "Interviewer speaking" : v.listening ? "Listening · auto-submit after 4 sec silence" : "Preparing to listen"}
                    </span>
                    {v.speaking && (
                      <button onClick={interruptAndAnswer} className="btn-dark">
                        <Mic size={16} /> Interrupt and answer
                      </button>
                    )}
                  </>
                ) : (
                  v.listening ? (
                    <button onClick={v.stop} className="btn bg-coral text-white hover:bg-coral/90 mic-live" disabled={phase === "evaluating"}>
                      <Square size={16} fill="currentColor" /> Stop speaking
                    </button>
                  ) : !isCoding ? (
                    <button onClick={startListening} className="btn-primary" disabled={phase === "evaluating" || !v.supported || cameraState.state !== "ready"}>
                      <Mic size={16} /> Start speaking
                    </button>
                  ) : null
                )}
                <button className="btn-dark" onClick={replayQuestion} disabled={phase === "evaluating" || cameraState.state !== "ready"}><RefreshCw size={16} /> Replay question</button>
                <button className="btn-dark" onClick={toggleMute} aria-pressed={muted} aria-label={muted ? "Unmute interviewer voice" : "Mute interviewer voice"}>
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>
              {!v.supported && (
                <p className="mt-3 flex items-center justify-center gap-2 text-sm text-amber"><MicOff size={14} /> Voice input needs Chrome or Edge. Type your answer below.</p>
              )}
            </>
          )}
        </section>

        {(phase === "question" || phase === "evaluating") && (
          <section className="panel p-5">
            {isCoding ? (
              <CodeEditor language={session.config.language} code={code} onChange={setCode} label="Run solution" />
            ) : (
            <>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="answer" className="text-sm font-semibold">Your answer</label>
              {v.listening && <span className="chip bg-coral-tint text-coral"><span className="h-2 w-2 rounded-full bg-coral" /> Listening</span>}
            </div>
            <textarea
              id="answer" rows={5} value={v.text} disabled={phase === "evaluating"}
              onFocus={() => {
                if (v.listening) v.stop();
                setManualVoice(true);
              }}
              onChange={(e) => v.setText(e.target.value)}
              placeholder={autoVoice
                ? "Your answer is transcribed here. Focus this box to edit and switch to manual submission."
                : "Answer out loud or type here, then submit your answer."}
              className="w-full resize-y rounded-xl border border-line bg-canvas p-3 text-sm leading-relaxed placeholder:text-ink-faint focus:border-cobalt focus:outline-none"
            />
            </>
            )}
            {(error || v.error) && <div className="mt-3"><ErrorBox message={error || v.error} /></div>}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <button className="text-sm text-ink-mute hover:text-ink" onClick={() => v.setText("")} disabled={!v.text || phase === "evaluating"}>Clear</button>
              {(isCoding || manualVoice) && (
                <button className="btn-primary" onClick={() => submit()} disabled={phase === "evaluating" || cameraState.state !== "ready" || (isCoding ? code.trim().length < 3 : v.text.trim().length < 3)}>
                  {phase === "evaluating" ? <><Loader2 size={16} className="animate-spin" /> Evaluating</> : <><Send size={16} /> Submit answer</>}
                </button>
              )}
            </div>
          </section>
        )}
        {phase === "feedback" && error && <ErrorBox message={error} />}
      </div>

      {/* RIGHT: progress, feedback, agent activity */}
      <aside className="space-y-4" aria-label="Interview insights">
        <section className="panel p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Progress</span>
            <span className="text-ink-mute">{progress.answered}/{progress.total} answered</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-cobalt transition-all" style={{ width: `${pct}%` }} /></div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-ink-mute"><Gauge size={14} /> Current difficulty</span>
            <span className="chip bg-cobalt-tint text-cobalt">{cap(difficulty)}</span>
          </div>
          {history.length > 0 && (
            <button className="mt-4 w-full text-left text-xs text-ink-faint underline-offset-2 hover:text-coral hover:underline" onClick={endEarly}>
              End interview early and get my report
            </button>
          )}
        </section>

        {lastEval ? (
          <section className="panel p-5">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold"><MessageSquareQuote size={16} /> Feedback on your last answer</h3>
            <div className="space-y-3">
              <ScoreBar label="Correctness" value={lastEval.correctness} max={10} />
              <ScoreBar label="Concepts" value={lastEval.conceptual} max={10} />
              <ScoreBar label="Clarity" value={lastEval.clarity} max={10} />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">{lastEval.feedback}</p>
            {lastEval.missingConcepts?.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-xs font-semibold text-ink-mute">You didn't mention</div>
                <div className="flex flex-wrap gap-1.5">
                  {lastEval.missingConcepts.map((m) => <span key={m} className="chip bg-amber-tint text-amber">{m}</span>)}
                </div>
              </div>
            )}
            {lastEval.source === "fallback" && <p className="mt-3 text-xs text-ink-faint">Scored offline (AI unavailable), so results are approximate.</p>}
          </section>
        ) : (
          <section className="panel p-5 text-sm text-ink-mute">Feedback appears here after you submit your first answer.</section>
        )}

        {plan && (
          <section className="panel p-5">
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold"><Brain size={16} /> What the agents decided</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3"><Target size={16} className="mt-0.5 shrink-0 text-cobalt" />
                <span><b>Evaluator</b> scored this answer {lastEval?.score}/100.</span></li>
              <li className="flex gap-3"><Gauge size={16} className="mt-0.5 shrink-0 text-cobalt" />
                <span><b>Learning agent</b>{" "}
                  {plan.difficultyChange === "same" ? "kept the difficulty the same." : `made questions ${plan.difficultyChange}.`}
                  {plan.weakTopics.length > 0 && ` Weak topics: ${plan.weakTopics.join(", ")}.`}</span></li>
              <li className="flex gap-3"><Sparkles size={16} className="mt-0.5 shrink-0 text-cobalt" />
                <span><b>Interviewer</b>{" "}
                  {plan.followUp.needed ? `is asking a follow-up. ${plan.followUp.reason}.` : result?.next ? "is moving to a new topic." : "has no more questions."}</span></li>
            </ul>
          </section>
        )}

        {history.length > 0 && (
          <section className="panel p-5">
            <h3 className="mb-3 text-base font-bold">Answered so far</h3>
            <ul className="space-y-3">
              {history.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{h.topic}{h.isFollowUp && <span className="ml-1.5 text-xs font-normal text-amber">follow-up</span>}</div>
                    <div className="truncate text-xs text-ink-faint">{h.text}</div>
                  </div>
                  <ScorePill score={h.score} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
