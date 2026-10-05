"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import { saveRevision } from "@/lib/validation/revision";

type PQ = { question: string; options: string[]; answer: string; explanation: string };

export default function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pq, setPq] = useState<PQ | null>(null);
  const [pick, setPick] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem("studymate-history") ?? "[]");
      const found = arr.find((x: { id: string }) => x.id === id);
      setPq(found?.lesson?.practiceQuestion ?? null);
    } catch { setPq(null); }
  }, [id]);

  async function submit() {
    setResult("");
    const correct = pq && pick === pq.answer;
    const score = correct ? 1 : 0;
    const res = await fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: id, answers: { q1: pick }, score, total: 1 }),
    });
    const data = await res.json();
    if (!data.success) { setResult("Submit failed."); return; }
    if (!correct && pq) {
      try {
        const arr = JSON.parse(localStorage.getItem("studymate-history") ?? "[]");
        const found = arr.find((x: { id: string }) => x.id === id);
        saveRevision({ lessonId: id, topic: found?.title ?? "Study topic", question: pq.question, correctAnswer: pq.answer });
      } catch {}
    }
    setResult(correct ? `Correct! ${pq!.explanation}` : `Not quite. Correct: ${pq?.answer}. ${pq?.explanation} — saved to your revision queue.`);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <Link href="/study" className="text-sm underline">← Study</Link>
      <h1 className="mt-2 text-2xl font-bold">Quiz</h1>
      {!pq ? <p className="mt-4 text-sm">Practice question not found on this device. Ask it again on /study.</p> : (
        <div className="mt-4 rounded border p-4">
          <p className="font-medium">{pq.question}</p>
          <div className="mt-3 grid gap-2">
            {pq.options.map((o) => (
              <button key={o} onClick={() => setPick(o)} className={`rounded border p-2 text-left ${pick === o ? "border-black font-semibold" : ""}`}>{o}</button>
            ))}
          </div>
          <button disabled={!pick} onClick={submit} className="mt-4 rounded-full bg-black px-5 py-2 text-white disabled:opacity-40 dark:bg-white dark:text-black">Submit</button>
          {result && <p className="mt-3 text-sm">{result}</p>}
        </div>
      )}
    </div>
  );
}
