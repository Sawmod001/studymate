// Client-side validation store (localStorage). Used until Supabase keys are set,
// and as an offline backup afterwards. No personal data — aggregates only.
"use client";

export interface ValidationEntry {
  date: string;
  language: string;
  inputType: "voice" | "text";
  subject: string;
  academicLevel: string;
  transcriptionSuccess: "yes" | "partly" | "no";
  usefulness: number;
  clarity: "yes" | "partly" | "no";
  userCorrection: boolean;
}

const KEY = "studymate-validation";

export function saveValidationLocal(e: ValidationEntry) {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    arr.push(e);
    localStorage.setItem(KEY, JSON.stringify(arr.slice(-500)));
  } catch {}
}

export function loadValidationLocal(): ValidationEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}
