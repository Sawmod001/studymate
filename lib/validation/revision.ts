// Spaced-revision queue (device-local until Supabase quiz_attempts sync lands).
// Wrong quiz answers land here; history page surfaces "Review weak topics".
"use client";

export interface RevisionItem {
  lessonId: string;
  topic: string;
  question: string;
  correctAnswer: string;
  date: string;
}

const KEY = "studymate-revision";

export function saveRevision(item: Omit<RevisionItem, "date">) {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) ?? "[]") as RevisionItem[];
    if (arr.some((r) => r.lessonId === item.lessonId && r.question === item.question)) return;
    arr.unshift({ ...item, date: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(arr.slice(0, 100)));
  } catch {}
}

export function loadRevision(): RevisionItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function clearRevision(lessonId: string) {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) ?? "[]") as RevisionItem[];
    localStorage.setItem(KEY, JSON.stringify(arr.filter((r) => r.lessonId !== lessonId)));
  } catch {}
}
