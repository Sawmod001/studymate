"use client";
import { useEffect, useRef, useState } from "react";

type VoiceState = "idle" | "recording" | "transcribing" | "generating" | "complete" | "error";
export interface VoiceResult {
  transcript: string;
  lesson: {
    id: string; title: string; explanation: string; keyPoints: string[];
    example: string; commonMistake: string;
    practiceQuestion: { question: string; options: string[]; answer: string; explanation: string };
  };
  provider: string;
  notice?: string;
}

// Browser recorder -> POST /api/voice. States per 08-UI-SPEC voice recorder states.
export default function VoiceRecorder({ language, level, subject, mode, onResult }: {
  language: string; level: string; subject: string; mode: string;
  onResult: (r: VoiceResult) => void;
}) {
  const [state, setState] = useState<VoiceState>("idle");
  const [secs, setSecs] = useState(0);
  const [error, setError] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function start() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const rec = new MediaRecorder(stream, {
        ...(mime ? { mimeType: mime } : {}),
        audioBitsPerSecond: 32000, // low-bitrate: small uploads for poor networks
      });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); void upload(new Blob(chunksRef.current)); };
      recRef.current = rec;
      rec.start();
      setState("recording");
      setSecs(0);
      timerRef.current = setInterval(() => setSecs((s) => {
        if (s + 1 >= 120) { stop(); return s; }
        return s + 1;
      }), 1000);
    } catch {
      setState("error");
      setError("Microphone blocked. Allow mic access or type your question.");
    }
  }

  function stop() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    const rec = recRef.current;
    if (rec && rec.state !== "inactive") { setState("transcribing"); rec.stop(); }
    else setState("idle");
  }

  async function upload(blob: Blob) {
    // Single endpoint does ASR then LLM; labels reflect the phase honestly:
    // "transcribing" while waiting, "generating" after 8s (ASR typically done).
    setState("transcribing");
    const phase = setTimeout(() => setState((s) => (s === "transcribing" ? "generating" : s)), 8000);
    try {
      const form = new FormData();
      form.append("audio", blob, "question.webm");
      form.append("language", language);
      form.append("academicLevel", level);
      form.append("subject", subject);
      form.append("mode", mode);
      const res = await fetch("/api/voice", { method: "POST", body: form });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? "Voice request failed");
      onResult(data as VoiceResult);
      setState("complete");
      setTimeout(() => setState((s) => (s === "complete" ? "idle" : s)), 3000);
    } catch (e: unknown) {
      setState("error");
      setError(e instanceof Error ? e.message : "Voice request failed");
    } finally {
      clearTimeout(phase);
    }
  }

  async function uploadFile(f: File) {
    setError("");
    if (f.size > 10 * 1024 * 1024) {
      setState("error");
      setError("Audio exceeds 10 MB. Send a shorter voice note.");
      return;
    }
    await upload(new Blob([f], { type: f.type || "audio/ogg" }));
  }

  return (
    <div className="rounded-xl border p-3">
      <div className="flex items-center gap-3">
        {state === "recording" ? (
          <button onClick={stop} className="rounded-full bg-red-600 px-5 py-2 font-medium text-white">■ Stop ({secs}s)</button>
        ) : (
          <button onClick={start} disabled={state === "transcribing" || state === "generating"} className="rounded-full bg-black px-5 py-2 font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black">
            {state === "transcribing" ? "Transcribing…" : state === "generating" ? "Generating answer…" : state === "complete" ? "✓ Complete" : "🎙 Ask by Voice"}
          </button>
        )}
        <span className="text-xs text-zinc-500">state: {state} • max 120s • 10MB</span>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <label className="mt-2 block text-sm text-zinc-500">
        No mic? Upload a voice note instead (e.g. forwarded WhatsApp audio):
        <input
          type="file" accept="audio/*" className="mt-1 block"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadFile(f); e.target.value = ""; }}
        />
      </label>
    </div>
  );
}
