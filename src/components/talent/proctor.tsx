import { useEffect, useRef, useState } from "react";
import { proctorKind, type ProctorKind } from "@/domain/proctor";
import { recordProctorEvent } from "@/server/talent.functions";

type FaceBox = { boundingBox?: { x: number; y: number; width: number; height: number } };

type Detector = { detect: (source: CanvasImageSource) => Promise<FaceBox[]> };

function detector(): Detector | null {
  const host = window as unknown as {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => Detector;
  };
  if (!host.FaceDetector) return null;
  try {
    return new host.FaceDetector({ fastMode: true, maxDetectedFaces: 2 });
  } catch {
    return null;
  }
}

export function ExamProctor({
  liveAttemptId,
  onCamera,
}: {
  liveAttemptId?: string;
  onCamera?: (ready: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState("Camera is off.");
  const [faces, setFaces] = useState<string>("Face check waits for the camera.");
  const [log, setLog] = useState<{ id: number; text: string }[]>([]);
  const seq = useRef(0);
  const lastFace = useRef<string>("");

  function note(kind: ProctorKind, detail: string) {
    const text = `${kind.replaceAll("_", " ").toLowerCase()}: ${detail}`;
    setLog((current) => {
      if (kind === "HEARTBEAT") return current;
      if (current[0]?.text === text) return current;
      const id = seq.current + 1;
      seq.current = id;
      return [{ id, text }, ...current].slice(0, 6);
    });
    if (!liveAttemptId) return;
    void recordProctorEvent({ data: { attemptId: liveAttemptId, kind, detail } }).catch(() => {
      setLog((current) => {
        const text = "A proctor note could not be saved.";
        if (current[0]?.text === text) return current;
        const id = seq.current + 1;
        seq.current = id;
        return [{ id, text }, ...current].slice(0, 6);
      });
    });
  }

  useEffect(() => {
    let stream: MediaStream | null = null;
    let heart: number | undefined;
    let faceTimer: number | undefined;
    let gone = false;
    const video = videoRef.current;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("This browser has no camera API.");
        note("CAMERA_DENIED", "No camera API.");
        onCamera?.(false);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (gone) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => undefined);
        }
        setStatus("Camera is on. The picture stays in this browser.");
        note("CAMERA_GRANTED", "Camera track started.");
        onCamera?.(true);
        heart = window.setInterval(() => {
          const live = stream?.getVideoTracks().some((track) => track.readyState === "live" && track.enabled);
          if (!live) {
            setStatus("The camera stopped.");
            note("CAMERA_ENDED", "Video track ended.");
            onCamera?.(false);
            return;
          }
          note("HEARTBEAT", "Camera track still live.");
        }, 25000);
        const facesApi = detector();
        if (!facesApi) {
          setFaces("This browser has no face detector. Only the camera and focus notes are recorded.");
        } else if (video) {
          faceTimer = window.setInterval(() => {
            void facesApi.detect(video).then((found) => {
              const next = found.length === 0 ? "NO_FACE" : found.length > 1 ? "EXTRA_FACE" : "ONE";
              setFaces(next === "ONE" ? "One face in frame." : next === "NO_FACE" ? "No face in frame." : "More than one face in frame.");
              if (next !== "ONE" && next !== lastFace.current) note(next, `${found.length} faces.`);
              lastFace.current = next;
            }).catch(() => setFaces("Face check failed in this browser."));
          }, 8000);
        }
      } catch {
        setStatus("Camera permission was denied.");
        note("CAMERA_DENIED", "Permission denied.");
        onCamera?.(false);
      }
    }

    void start();

    function hidden() {
      if (document.visibilityState === "hidden") note("TAB_HIDDEN", "The page was hidden.");
    }
    function blur() {
      note("WINDOW_BLUR", "The window lost focus.");
    }
    function fullscreen() {
      if (!document.fullscreenElement) note("FULLSCREEN_LEFT", "Fullscreen is off.");
    }
    function copied(event: ClipboardEvent) {
      const kind = proctorKind(event.type === "paste" ? "PASTE" : "COPY");
      if (kind) note(kind, "Clipboard use during the exam.");
    }
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("blur", blur);
    document.addEventListener("fullscreenchange", fullscreen);
    document.addEventListener("copy", copied);
    document.addEventListener("paste", copied);

    return () => {
      gone = true;
      if (heart) window.clearInterval(heart);
      if (faceTimer) window.clearInterval(faceTimer);
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("blur", blur);
      document.removeEventListener("fullscreenchange", fullscreen);
      document.removeEventListener("copy", copied);
      document.removeEventListener("paste", copied);
      if (stream) for (const track of stream.getTracks()) track.stop();
      onCamera?.(false);
    };
  }, [liveAttemptId]);

  return (
    <aside className="rounded-[24px] border border-line bg-white shadow-[0_8px_24px_rgba(20,34,27,0.04)] p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-muted">Browser proctor</p>
          <p>{status}</p>
          <p className="text-muted">{faces}</p>
        </div>
        <video ref={videoRef} className="h-24 w-32 rounded-md bg-bg object-cover" muted playsInline autoPlay />
      </div>
      <button
        type="button"
        className="mt-2 min-h-11 text-sm text-link"
        onClick={() => {
          void document.documentElement.requestFullscreen?.().catch(() => setStatus("Fullscreen was blocked."));
        }}
      >
        Enter fullscreen
      </button>
      <ul className="mt-2 space-y-1 text-muted">
        {log.map((line) => <li key={line.id}>{line.text}</li>)}
      </ul>
      <p className="mt-2 text-xs text-muted">Notes cover the camera, tab hiding, focus, fullscreen, copy, and paste. Frames are not stored. This is not a certified exam browser.</p>
    </aside>
  );
}
