"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { loadRevision, clearRevision, type RevisionItem } from "@/lib/validation/revision";

type Item = { id: string; title: string; subject: string; language: string; date: string };

export default function HistoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [rev, setRev] = useState<RevisionItem[]>([]);
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("studymate-history") ?? "[]"));
    } catch { setItems([]); }
    setRev(loadRevision());
  }, []);

  function mastered(lessonId: string) {
    clearRevision(lessonId);
    setRev(loadRevision());
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <Header />
      <main className="mx-auto max-w-3xl px-6 pb-16">
        <h1 className="text-3xl font-bold">History</h1>
        <p className="mt-1 text-sm text-zinc-500">Local device history (Supabase sync activates with keys).</p>

        {rev.length > 0 && (
          <section className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:bg-zinc-900">
            <h2 className="font-semibold">📚 Review weak topics ({rev.length})</h2>
            <ul className="mt-2 grid gap-2">
              {rev.map((r, i) => (
                <li key={`${r.lessonId}-${i}`} className="rounded border bg-white p-3 text-sm dark:bg-black">
                  <p className="font-medium">{r.topic}</p>
                  <p className="mt-1">{r.question}</p>
                  <p className="mt-1 text-zinc-500">Correct: {r.correctAnswer}</p>
                  <div className="mt-2 flex gap-2">
                    <Link href={`/learn/${r.lessonId}`} className="underline">Re-study</Link>
                    <button onClick={() => mastered(r.lessonId)} className="underline">Mark mastered</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ul className="mt-4 grid gap-2">
          {items.map((i) => (
            <li key={i.id} className="rounded border bg-white p-3 dark:bg-zinc-900">
              <Link href={`/learn/${i.id}`} className="font-semibold underline">{i.title}</Link>
              <p className="text-sm text-zinc-500">{i.subject} • {i.language} • {new Date(i.date).toLocaleString()}</p>
            </li>
          ))}
          {items.length === 0 && <p className="text-sm">No lessons yet — <Link href="/study" className="underline">ask your first question</Link>.</p>}
        </ul>
      </main>
    </div>
  );
}
