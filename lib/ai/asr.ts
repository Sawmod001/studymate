// N-ATLAS ASR adapter — server-only. Official N-ATLAS ASR service only.
// Per challenge: generic Whisper is NOT a substitute for required N-ATLAS ASR.
// Env: NATLAS_API_BASE_URL + NATLAS_API_KEY + NATLAS_ASR_PATH + per-language
// model ids (defaults below). All values must come from official onboarding.
import type { StudyLanguage } from "./natlas";

export function asrModelFor(language: string): string {
  switch (language) {
    case "yo": return process.env.NATLAS_ASR_YORUBA_MODEL ?? "NCAIR1/Yoruba-ASR";
    case "ha": return process.env.NATLAS_ASR_HAUSA_MODEL ?? "NCAIR1/Hausa-ASR";
    case "ig": return process.env.NATLAS_ASR_IGBO_MODEL ?? "NCAIR1/Igbo-ASR";
    default: return process.env.NATLAS_ASR_ENGLISH_MODEL ?? "NCAIR1/NigerianAccentedEnglish";
  }
}

export function isAsrConfigured() {
  return Boolean(process.env.NATLAS_API_BASE_URL && process.env.NATLAS_API_KEY && process.env.NATLAS_ASR_PATH);
}

function err(code: string, message: string): Error {
  return Object.assign(new Error(message), { code });
}

export interface AsrInput {
  audio: Buffer;
  filename: string;
  mimeType: string;
  language: StudyLanguage;
}

// Returns { transcript }. Throws with .code on failure. Never fabricate transcripts.
export async function transcribeWithNatlas({ audio, filename, mimeType, language }: AsrInput): Promise<{ transcript: string }> {
  const baseUrl = process.env.NATLAS_API_BASE_URL;
  const apiKey = process.env.NATLAS_API_KEY;
  const path = process.env.NATLAS_ASR_PATH;

  if (!baseUrl || !apiKey) throw err("NATLAS_ASR_UNCONFIGURED", "N-ATLAS ASR not configured. Set NATLAS_API_BASE_URL and NATLAS_API_KEY.");
  if (!path) throw err("NATLAS_ASR_NOT_IMPLEMENTED", "NATLAS_ASR_PATH missing. Copy the official ASR endpoint path from onboarding docs.");
  if (!audio.length) throw err("EMPTY_AUDIO", "No audio received.");

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(audio)], { type: mimeType }), filename);
  form.append("model", asrModelFor(language));
  form.append("language", language);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120_000);
  let res: Response;
  try {
    // NOTE: adjust field names to the official N-ATLAS ASR schema if different.
    res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } catch (e: unknown) {
    clearTimeout(timer);
    if (e instanceof DOMException && e.name === "AbortError") throw err("ASR_TIMEOUT", "ASR request timed out.");
    throw err("ASR_UNREACHABLE", "Could not reach the N-ATLAS ASR service.");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw err("ASR_AUTH", "N-ATLAS ASR rejected the API key.");
    if (res.status === 413) throw err("AUDIO_TOO_LARGE", "Audio file too large for ASR.");
    if (res.status === 429) throw err("ASR_RATE_LIMIT", "ASR rate limit reached. Try again shortly.");
    throw err("ASR_UPSTREAM", `ASR error (HTTP ${res.status}).`);
  }

  const data = (await res.json().catch(() => null)) as { text?: string; transcript?: string } | null;
  const transcript = data?.text ?? data?.transcript;
  if (!transcript || !transcript.trim()) throw err("ASR_EMPTY", "ASR returned an empty transcript.");
  return { transcript: transcript.trim() };
}
