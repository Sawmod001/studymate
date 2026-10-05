"use client";
// Anonymous session key (no login per MVP privacy rule). Sent with history
// saves so Supabase rows group by device without personal data.
export function getSessionKey(): string {
  try {
    let k = localStorage.getItem("studymate-session");
    if (!k) {
      k = crypto.randomUUID();
      localStorage.setItem("studymate-session", k);
    }
    return k;
  } catch {
    return "unknown";
  }
}
