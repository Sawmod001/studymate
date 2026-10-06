"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import VoiceRecorder, { type VoiceResult } from "@/components/voice/VoiceRecorder";
import ReadAloud from "@/components/study/ReadAloud";
import ShareButtons from "@/components/study/ShareButtons";
import { saveValidationLocal } from "@/lib/validation/store";
import { getSessionKey } from "@/lib/db/session";

type Lesson = {
  id: string;
  title: string;
  explanation: string;
  englishGloss?: string;
  examRelevance?: string;
  keyPoints: string[];
  example: string;
  commonMistake: string;
  practiceQuestion: { question: string; options: string[]; answer: string; explanation: string };
};

const LANGS = [
  { v: "yo", l: "Yoruba" },
  { v: "ha", l: "Hausa" },
  { v: "ig", l: "Igbo" },
  { v: "en-NG", l: "Nigerian English" },
  { v: "en", l: "English" },
];
const MODES = ["explain", "explain-simply", "step-by-step", "example", "practice", "translate", "exam"] as const;
const LEVELS = ["Primary", "JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3", "University"];

function saveLocal(item: { id: string; title: string; subject: string; language: string; lesson: Lesson }) {
  try {
    const raw = localStorage.getItem("studymate-history") ?? "[]";
    const arr = JSON.parse(raw);
    arr.unshift({ ...item, date: new Date().toISOString() });
    localStorage.setItem("studymate-history", JSON.stringify(arr.slice(0, 50)));
  } catch {}
}

// Fire-and-forget Neon sync (server returns 202 when keys are missing).
function persistServer(item: { question: string; inputType: "voice" | "text"; transcript: string; subject: string; language: string; level: string; lesson: Lesson }) {
  try {
    void fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionKey: getSessionKey(), language: item.language, academicLevel: item.level, subject: item.subject, question: item.question, inputType: item.inputType, transcript: item.transcript, lesson: item.lesson }),
    });
  } catch {}
}

export default function StudyPage() {
  const [question, setQuestion] = useState("");
  const [language, setLanguage] = useState("yo");
  const [level, setLevel] = useState("SS2");
  const [subject, setSubject] = useState("Biology");
  const [mode, setMode] = useState<(typeof MODES)[number]>("explain");
  const [loading, setLoading] = useState(false);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [provider, setProvider] = useState<string>("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState("");
  const [inputType, setInputType] = useState<"text" | "voice">("text");
  const [engine, setEngine] = useState<"checking" | "live" | "down" | "unconfigured">("checking");

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then((h) => {
      if (!h?.natlas?.baseUrlSet) setEngine("unconfigured");
      else setEngine(h.natlas.reachable ? "live" : "down");
    }).catch(() => setEngine("checking"));
  }, []);
  // Validation feedback (05-VALIDATION.md mini-form)
  const [useful, setUseful] = useState(5);
  const [correct, setCorrect] = useState("yes");
  const [fbMsg, setFbMsg] = useState("");

  async function askText(q: string, overrideMode?: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, language, academicLevel: level, subject, mode: overrideMode ?? mode }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message ?? "Request failed");
      setLesson(data.lesson);
      setProvider(data.provider ?? "");
      setNotice(data.notice ?? "");
      setInputType("text");
      saveLocal({ id: data.lesson.id, title: data.lesson.title, subject, language, lesson: data.lesson });
      persistServer({ question: q, inputType: "text", transcript: "", subject, language, level, lesson: data.lesson });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function onVoice(r: VoiceResult) {
    setLesson(r.lesson);
    setProvider(r.provider ?? "");
    setNotice(r.notice ?? "");
    setTranscript(r.transcript);
    setQuestion(r.transcript);
    setInputType("voice");
    saveLocal({ id: r.lesson.id, title: r.lesson.title, subject, language, lesson: r.lesson });
    persistServer({ question: r.transcript, inputType: "voice", transcript: r.transcript, subject, language, level, lesson: r.lesson });
  }

  async function sendFeedback() {
    setFbMsg("");
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language, inputType, subject, academicLevel: level,
          transcriptionSuccess: inputType === "voice" ? correct : "yes",
          usefulness: useful, clarity: correct, userCorrection: transcript !== "" && transcript !== question, feedback: "",
        }),
      });
      const data = await res.json();
      saveValidationLocal({
        date: new Date().toISOString(), language, inputType, subject, academicLevel: level,
        transcriptionSuccess: (inputType === "voice" ? correct : "yes") as "yes" | "partly" | "no",
        usefulness: useful, clarity: correct as "yes" | "partly" | "no",
        userCorrection: transcript !== "" && transcript !== question,
      });
      setFbMsg(data.success ? "Thanks — feedback logged." : "Feedback failed.");
    } catch {
      setFbMsg("Feedback failed.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link href="/" className="text-sm underline">← Home</Link>
      <h1 className="mt-2 text-3xl font-bold">Study</h1>
      {engine === "live" && (
        <p className="mt-2 rounded bg-green-100 p-2 text-sm text-green-900">● AI engine live — genuine N-ATLAS answers.</p>
      )}
      {engine === "down" && (
        <p className="mt-2 rounded bg-red-100 p-2 text-sm text-red-900">
          ● AI engine offline (Colab/tunnel asleep) — questions will fail until it is restarted. Answers are never faked.
        </p>
      )}
      {engine === "unconfigured" && (
        <p className="mt-2 rounded bg-amber-100 p-2 text-sm text-amber-900">
          N-ATLAS not configured — answers are labeled placeholders until keys are set.
        </p>
      )}
      {provider.includes("local-placeholder") && (
        <p className="mt-2 rounded bg-amber-100 p-2 text-sm text-amber-900">
          Placeholder answer (NOT N-ATLAS). {notice || "Set N-ATLAS keys for genuine responses."}
        </p>
      )}
      <div className="mt-4 grid gap-3 rounded-xl border p-4">
        <label className="grid gap-1 text-sm">Language
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="rounded border p-2">
            {LANGS.map((l) => <option key={l.v} value={l.v}>{l.l}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">Level (NERDC class)
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded border p-2">
              {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm">Subject
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded border p-2" />
          </label>
        </div>
        <label className="grid gap-1 text-sm">Mode
          <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="rounded border p-2">
            {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <VoiceRecorder language={language} level={level} subject={subject} mode={mode} onResult={onVoice} />
        {transcript && (
          <label className="grid gap-1 text-sm">Transcript (correct it if needed, then re-ask)
            <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={2} className="rounded border p-2" />
            <button onClick={() => { setQuestion(transcript); askText(transcript); }} className="mt-1 w-fit rounded-full border px-4 py-2 text-sm">Ask with corrected transcript</button>
          </label>
        )}
        <label className="grid gap-1 text-sm">Or type your question
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} placeholder="e.g. Explain photosynthesis" className="rounded border p-2" />
        </label>
        <button disabled={loading || question.trim().length < 3} onClick={() => askText(question)} className="rounded-full bg-black px-6 py-3 font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black">
          {loading ? "Thinking…" : "Ask by Text"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {lesson && (
        <article className="mt-6 rounded-xl border p-4">
          <h2 className="text-xl font-bold">{lesson.title}</h2>
          {lesson.examRelevance && (
            <p className="mt-2 inline-block rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-900">🎯 {lesson.examRelevance}</p>
          )}
          <p className="mt-2">{lesson.explanation}</p>
          {lesson.englishGloss && (
            <details className="mt-2 rounded bg-zinc-100 p-2 text-sm dark:bg-zinc-800">
              <summary className="cursor-pointer font-medium">English gloss ( bilingual )</summary>
              <p className="mt-1">{lesson.englishGloss}</p>
            </details>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <ReadAloud text={`${lesson.title}. ${lesson.explanation}`} language={language} />
            <ShareButtons lessonId={lesson.id} title={lesson.title} />
          </div>
          <h3 className="mt-4 font-semibold">Key points</h3>
          <ul className="list-disc pl-5">{lesson.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ul>
          <h3 className="mt-4 font-semibold">Example</h3>
          <p>{lesson.example}</p>
          <h3 className="mt-4 font-semibold">Common mistake</h3>
          <p>{lesson.commonMistake}</p>
          <h3 className="mt-4 font-semibold">Practice</h3>
          <p>{lesson.practiceQuestion.question}</p>
          <ul className="mt-1 list-disc pl-5">{lesson.practiceQuestion.options.map((o, i) => <li key={i}>{o}</li>)}</ul>
          <div className="mt-2 text-sm">Answer: {lesson.practiceQuestion.answer} — {lesson.practiceQuestion.explanation}</div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={() => askText(question, "explain-simply")} className="rounded-full border px-4 py-2 text-sm">Explain simpler</button>
            <button onClick={() => askText(question, "step-by-step")} className="rounded-full border px-4 py-2 text-sm">Step-by-step</button>
            <button onClick={() => askText(question, "example")} className="rounded-full border px-4 py-2 text-sm">Another example</button>
            <button onClick={() => askText(question, "practice")} className="rounded-full border px-4 py-2 text-sm">Practice this</button>
            <Link href={`/quiz/${lesson.id}`} className="rounded-full border px-4 py-2 text-sm">Open quiz →</Link>
          </div>
          <div className="mt-6 rounded border p-3">
            <h3 className="font-semibold">Was this useful? (validation)</h3>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <label>Usefulness (1-5) <input type="number" min={1} max={5} value={useful} onChange={(e) => setUseful(Number(e.target.value))} className="w-14 rounded border p-1" /></label>
              <label>Transcribed/understood?
                <select value={correct} onChange={(e) => setCorrect(e.target.value)} className="ml-1 rounded border p-1">
                  <option value="yes">Yes</option><option value="partly">Partly</option><option value="no">No</option>
                </select>
              </label>
              <button onClick={sendFeedback} className="rounded-full bg-black px-4 py-2 text-white dark:bg-white dark:text-black">Send feedback</button>
              {fbMsg && <span>{fbMsg}</span>}
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
