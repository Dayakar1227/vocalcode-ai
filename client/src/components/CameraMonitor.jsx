import { useEffect, useRef } from "react";
import { AlertTriangle, Camera } from "lucide-react";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite";
const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.2.0/wasm";

export default function CameraMonitor({ onStateChange, compact = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    let active = true;
    let stream;
    let detector;
    let timer;
    let missingSince = 0;

    const update = (state) => {
      if (active) onStateChange(state);
    };

    async function start() {
      try {
        update({ state: "loading", warning: "" });
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera access is not available in this browser.");
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
        const files = await FilesetResolver.forVisionTasks(WASM_URL);
        detector = await FaceDetector.createFromOptions(files, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.6,
        });
        if (!active) {
          detector.close();
          return;
        }
        update({ state: "ready", warning: "" });

        const check = () => {
          if (!active || !detector || videoRef.current.readyState < 2) return;
          try {
            const count = detector.detectForVideo(videoRef.current, performance.now()).detections.length;
            let warning = "";
            if (count > 1) {
              missingSince = 0;
              warning = "More than one face is visible. This is only a camera observation, not a cheating determination.";
            } else if (count === 0) {
              if (!missingSince) missingSince = Date.now();
              if (Date.now() - missingSince >= 2500) {
                warning = "No face detected. Check your camera framing; this can be inaccurate.";
              }
            } else {
              missingSince = 0;
            }
            update({ state: "ready", warning });
            timer = window.setTimeout(check, 800);
          } catch {
            update({ state: "error", error: "Local camera checks stopped unexpectedly. Retry the camera." });
          }
        };
        check();
      } catch (error) {
        stream?.getTracks().forEach((track) => track.stop());
        update({
          state: "error",
          error: error.message || "Could not start the camera. Allow camera access and retry.",
        });
      }
    }

    start();
    return () => {
      active = false;
      window.clearTimeout(timer);
      detector?.close();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onStateChange]);

  return compact ? (
    <section className="w-28 shrink-0 sm:w-36" aria-label="Local camera check">
      <div className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-white/80">
        <Camera size={13} /> Camera · local only
      </div>
      <video ref={videoRef} className="aspect-video w-full rounded-lg bg-black object-cover" muted playsInline />
      <p className="mt-1 text-[10px] leading-tight text-white/60">Not recorded or sent</p>
    </section>
  ) : (
    <section className="panel p-4" aria-label="Local camera check">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Camera size={16} /> Camera check
        <span className="ml-auto text-xs font-normal text-ink-faint">On-device · not recorded</span>
      </div>
      <video ref={videoRef} className="aspect-video w-full rounded-xl bg-ink object-cover" muted playsInline />
      <p className="mt-3 text-xs leading-relaxed text-ink-mute">
        Face presence is checked on this device only. No video or face data is saved or sent. These checks can be wrong and do not determine cheating.
      </p>
    </section>
  );
}

export function CameraStatus({ status, onRetry }) {
  if (status.state === "ready" && !status.warning) return null;
  const message = status.error || status.warning || "Starting camera and local checks…";
  return (
    <div className={`flex items-start gap-3 rounded-xl p-4 text-sm ${status.state === "error" || status.warning ? "bg-amber-tint text-amber" : "bg-canvas text-ink-mute"}`} role={status.state === "error" ? "alert" : "status"}>
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1">{message}</div>
      {status.state === "error" && <button className="font-semibold underline" onClick={onRetry}>Retry</button>}
    </div>
  );
}
