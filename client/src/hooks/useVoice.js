import { useCallback, useEffect, useRef, useState } from "react";

const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

/**
 * Voice input (Web Speech API) + voice output (SpeechSynthesis).
 * - Keeps listening through Chrome's automatic silence timeouts.
 * - Transcript is editable, so the textbox doubles as a fallback.
 */
export function useVoice() {
  const [text, setTextState] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");
  const recRef = useRef(null);
  const wantRef = useRef(false);
  const finalRef = useRef("");
  const textRef = useRef("");
  const muteRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const restartTimerRef = useRef(null);
  const startTimerRef = useRef(null);
  const onSilenceRef = useRef(null);
  const silenceMsRef = useRef(4000);
  const instanceRef = useRef(0);

  const setText = useCallback((v) => {
    textRef.current = v;
    setTextState(v);
  }, []);

  const start = useCallback(({ silenceMs, onSilence } = {}) => {
    if (!SR) {
      setError("Speech recognition isn't supported in this browser. Use Chrome or Edge, or type your answer.");
      return false;
    }
    window.clearTimeout(silenceTimerRef.current);
    window.clearTimeout(restartTimerRef.current);
    window.clearTimeout(startTimerRef.current);
    recRef.current?.abort?.();
    const instance = ++instanceRef.current;
    onSilenceRef.current = onSilence || null;
    silenceMsRef.current = silenceMs || 4000;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setError("");
    finalRef.current = textRef.current.trim();
    wantRef.current = true;

    const rec = new SR();
    let restartAttempts = 0;
    let started = false;
    const startRecognition = () => {
      if (!wantRef.current || instanceRef.current !== instance) return;
      try {
        rec.start();
      } catch {
        restartAttempts += 1;
        if (restartAttempts > 3) {
          wantRef.current = false;
          setListening(false);
          setError("Speech recognition stopped. Click Start speaking to retry, or type your answer.");
          return;
        }
        restartTimerRef.current = window.setTimeout(startRecognition, 300 * restartAttempts);
      }
    };
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onstart = () => {
      if (instanceRef.current === instance) {
        started = true;
        restartAttempts = 0;
        window.clearTimeout(startTimerRef.current);
        setListening(true);
      }
    };
    rec.onresult = (e) => {
      if (instanceRef.current !== instance) return;
      started = true;
      window.clearTimeout(startTimerRef.current);
      setListening(true);
      restartAttempts = 0;
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current = `${finalRef.current} ${r[0].transcript}`.trim();
        else interim += r[0].transcript;
      }
      const combined = `${finalRef.current} ${interim}`.trim();
      textRef.current = combined;
      setTextState(combined);
      if (combined.length >= 3 && onSilenceRef.current) {
        window.clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = window.setTimeout(() => {
          const answer = textRef.current.trim();
          if (answer.length < 3 || !wantRef.current) return;
          wantRef.current = false;
          window.clearTimeout(silenceTimerRef.current);
          recRef.current?.stop();
          setListening(false);
          const onSilence = onSilenceRef.current;
          onSilenceRef.current = null;
          onSilence?.(answer);
        }, silenceMsRef.current);
      }
    };
    rec.onerror = (e) => {
      if (instanceRef.current !== instance) return;
      if (e.error === "no-speech" && wantRef.current) return;
      wantRef.current = false;
      window.clearTimeout(silenceTimerRef.current);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone access is blocked. Allow it in the address bar, or type your answer.");
      } else if (e.error === "audio-capture") {
        setError("No microphone found. Connect one, or type your answer.");
      } else if (e.error === "network") {
        setError("Speech service unreachable. Check your connection, or type your answer.");
      } else if (e.error !== "aborted") {
        setError("Speech recognition stopped. Click Start speaking to retry, or type your answer.");
      }
      setListening(false);
    };
    rec.onend = () => {
      if (instanceRef.current !== instance) return;
      if (wantRef.current) {
        restartAttempts += 1;
        setListening(false);
        restartTimerRef.current = window.setTimeout(
          startRecognition,
          Math.min(300 * restartAttempts, 1500)
        );
        return;
      }
      setListening(false);
    };
    recRef.current = rec;
    startRecognition();
    startTimerRef.current = window.setTimeout(() => {
      if (!started && wantRef.current && instanceRef.current === instance) {
        wantRef.current = false;
        rec.abort?.();
        setListening(false);
        setError("Microphone did not start listening. Check browser microphone permission, then retry or type your answer.");
      }
    }, 8000);
    return wantRef.current;
  }, []);

  const stop = useCallback(() => {
    wantRef.current = false;
    instanceRef.current += 1;
    window.clearTimeout(silenceTimerRef.current);
    window.clearTimeout(restartTimerRef.current);
    window.clearTimeout(startTimerRef.current);
    onSilenceRef.current = null;
    recRef.current?.stop();
    setListening(false);
  }, []);

  const speak = useCallback((message, onEnd) => {
    const synth = window.speechSynthesis;
    if (!synth || muteRef.current || !message) { onEnd?.(); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(message);
    const voices = synth.getVoices();
    u.voice = voices.find((v) => /en-(US|GB|IN)/i.test(v.lang) && /google|natural|samantha|daniel/i.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang)) || null;
    u.rate = 1;
    u.onstart = () => setSpeaking(true);
    u.onend = () => { setSpeaking(false); onEnd?.(); };
    u.onerror = (e) => {
      setSpeaking(false);
      if (e.error !== "canceled" && e.error !== "interrupted") onEnd?.();
    };
    synth.speak(u);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const setMuted = useCallback((m) => {
    muteRef.current = m;
    if (m) stopSpeaking();
  }, [stopSpeaking]);

  useEffect(() => () => {
    wantRef.current = false;
    instanceRef.current += 1;
    window.clearTimeout(silenceTimerRef.current);
    window.clearTimeout(restartTimerRef.current);
    window.clearTimeout(startTimerRef.current);
    onSilenceRef.current = null;
    recRef.current?.abort?.();
    window.speechSynthesis?.cancel();
  }, []);

  return { supported: !!SR, text, setText, listening, speaking, error, setError, start, stop, speak, stopSpeaking, setMuted };
}
