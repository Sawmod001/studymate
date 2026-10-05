"use client";
import { use, useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import ReadAloud from "@/components/study/ReadAloud";
import ShareButtons from "@/components/study/ShareButtons";

interface Lesson {
  id: string; title: string; explanation: string; englishGloss?: string; examRelevance?: string;
  keyPoints: string[]; example: string; commonMistake: string;
  practiceQuestion: { question: string; options: string[]; answer: string; explanation: string };
}

export default function LearnPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [meta, setMeta] = useState<{ subject: string; language: string; date: string } | null>(null);

  useEffect(() => {
    try {
      const arr = JSON.parse(localStorage.getItem("studymate-history") ?? "[]");
      const found = arr.find((x: { id: string }) => x.id === id);
      setLesson(found?.lesson ?? null);
      if (found) setMeta({ subject: found.subject, language: found.language, date: found.date });
    } catch { setLesson(null); }
  }, [id]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <Header />
      <main className="mx-auto max-w-3xl px-6 pb-16">
        <Link href="/history" className="text-sm underline">← History</Link>
        {!lesson ? (
          <p className="mt-4 text-sm">Lesson not found on this device. <Link href="/study" className="underline">Ask a question</Link>.</p>
        ) : (
          <article className="mt-2 rounded-xl border bg-white p-5 dark:bg-zinc-900">
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            {meta && <p className="mt-1 text-sm text-zinc-500">{meta.subject} • {meta.language} • {new Date(meta.date).toLocaleString()}</p>}
            {"examRelevance" in lesson && (lesson as Lesson).examRelevance && (
              <p className="mt-2 inline-block rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-900">🎯 {(lesson as Lesson).examRelevance}</p>
            )}
            <p className="mt-3">{lesson.explanation}</p>
            {(lesson as Lesson).englishGloss && (
              <details className="mt-2 rounded bg-zinc-100 p-2 text-sm dark:bg-zinc-800">
                <summary className="cursor-pointer font-medium">English gloss ( bilingual )</summary>
                <p className="mt-1">{(lesson as Lesson).englishGloss}</p>
              </details>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <ReadAloud text={`${lesson.title}. ${lesson.explanation}`} language={meta?.language ?? "en"} />
              <ShareButtons lessonId={lesson.id} title={lesson.title} />
            </div>
            <h2 className="mt-5 font-semibold">Key points</h2>
            <ul className="list-disc pl-5">{lesson.keyPoints.map((k, i) => <li key={i}>{k}</li>)}</ul>
            <h2 className="mt-5 font-semibold">Example</h2>
            <p>{lesson.example}</p>
            <h2 className="mt-5 font-semibold">Common mistake</h2>
            <p>{lesson.commonMistake}</p>
            <h2 className="mt-5 font-semibold">Practice</h2>
            <p>{lesson.practiceQuestion.question}</p>
            <ul className="mt-1 list-disc pl-5">{lesson.practiceQuestion.options.map((o, i) => <li key={i}>{o}</li>)}</ul>
            <p className="mt-2 text-sm">Answer: {lesson.practiceQuestion.answer} — {lesson.practiceQuestion.explanation}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/study" className="rounded-full border px-4 py-2 text-sm">Ask another →</Link>
              <Link href={`/quiz/${lesson.id}`} className="rounded-full bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black">Take quiz →</Link>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
