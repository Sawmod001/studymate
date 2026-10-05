// N-ATLAS LLM adapter — server-only. Never import into client components.
// Fill NATLAS_API_BASE_URL + NATLAS_API_KEY + NATLAS_LLM_PATH from official
// NCAIR/NAIC onboarding. Per 04-N-ATLAS-INTEGRATION.md: never invent endpoints,
// never expose secrets to the browser, never claim N-ATLAS without this call.
import { buildStudyPrompt } from "./prompts";

export type StudyMode = "explain" | "explain-simply" | "step-by-step" | "example" | "practice" | "quiz" | "translate" | "exam";
export type StudyLanguage = "yo" | "ha" | "ig" | "en-NG" | "en";

export interface StudyInput {
  question: string;
  language: StudyLanguage;
  level: string;
  subject: string;
  mode: StudyMode;
}

export function isNatlasConfigured() {
  return Boolean(process.env.NATLAS_API_BASE_URL && process.env.NATLAS_API_KEY && process.env.NATLAS_LLM_PATH);
}

export function natlasStatus() {
  return {
    configured: isNatlasConfigured(),
    baseUrlSet: Boolean(process.env.NATLAS_API_BASE_URL),
    keySet: Boolean(process.env.NATLAS_API_KEY),
    llmPathSet: Boolean(process.env.NATLAS_LLM_PATH),
    asrPathSet: Boolean(process.env.NATLAS_ASR_PATH),
    model: process.env.NATLAS_LLM_MODEL ?? "NCAIR1/N-ATLaS",
  };
}

function err(code: string, message: string): Error {
  return Object.assign(new Error(message), { code });
}

// Calls the official N-ATLAS LLM. Throws with .code on any failure so routes can
// map to the API error format. Returns parsed JSON (validated by the route).
export async function generateStudyResponse(input: StudyInput): Promise<unknown> {
  const baseUrl = process.env.NATLAS_API_BASE_URL;
  const apiKey = process.env.NATLAS_API_KEY;
  const path = process.env.NATLAS_LLM_PATH;
  const model = process.env.NATLAS_LLM_MODEL ?? "NCAIR1/N-ATLaS";

  if (!baseUrl || !apiKey) {
    throw err("NATLAS_UNCONFIGURED", "N-ATLAS not configured. Set NATLAS_API_BASE_URL and NATLAS_API_KEY from official onboarding.");
  }
  if (!path) {
    // Keys exist but official endpoint path not supplied yet — stop honestly.
    throw err("NATLAS_NOT_IMPLEMENTED", "N-ATLAS keys set but NATLAS_LLM_PATH missing. Copy the official LLM endpoint path from onboarding docs.");
  }

  const prompt = buildStudyPrompt({ question: input.question, language: input.language, level: input.level, subject: input.subject, mode: input.mode });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      // NOTE: adjust keys below to the official N-ATLAS request schema if it differs.
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are StudyMate, an educational assistant powered by N-ATLAS. Always return valid JSON only." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
  } catch (e: unknown) {
    clearTimeout(timer);
    if (e instanceof DOMException && e.name === "AbortError") throw err("NATLAS_TIMEOUT", "N-ATLAS request timed out.");
    throw err("NATLAS_UNREACHABLE", "Could not reach the N-ATLAS service.");
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) throw err("NATLAS_AUTH", "N-ATLAS rejected the API key.");
    if (res.status === 429) throw err("NATLAS_RATE_LIMIT", "N-ATLAS rate limit reached. Try again shortly.");
    throw err("NATLAS_UPSTREAM", `N-ATLAS error (HTTP ${res.status}).`);
  }

  const data = (await res.json().catch(() => null)) as {
    choices?: Array<{ message?: { content?: string } }>;
  } | null;
  const content = data?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") throw err("NATLAS_SCHEMA_MISMATCH", "N-ATLAS returned an unexpected shape.");
  try {
    return JSON.parse(content);
  } catch {
    throw err("NATLAS_SCHEMA_MISMATCH", "N-ATLAS did not return valid JSON.");
  }
}

// TEMPORARY local template for UI development ONLY. Explicitly NOT N-ATLAS.
// The API route labels responses with provider:"local-placeholder" so evaluators
// can never mistake this for genuine N-ATLAS output. Delete once N-ATLAS is wired.
export function buildLocalPlaceholder(input: StudyInput) {
  const langNote: Record<StudyLanguage, string> = {
    yo: "Ìtumọ̀ ni Yorùbá (àpẹẹrẹ ìbílẹ̀ — N-ATLAS yóò rọ́pò rẹ̀).",
    ha: "Bayani a Hausa (misali na wucin gadi — N-ATLAS zai maye gurbinsa).",
    ig: "Nkọwa na Igbo (nwa oge — N-ATLAS ga-anọchi ya).",
    "en-NG": "Explanation in simple Nigerian English (placeholder — N-ATLAS will replace this).",
    en: "Explanation in simple English (placeholder — N-ATLAS will replace this).",
  };
  const q = input.question.trim();
  return {
    title: q.length > 60 ? q.slice(0, 60) + "…" : q || "Study topic",
    explanation: `${langNote[input.language]} You asked (${input.mode}) in ${input.subject} at ${input.level} level: "${q}". Connect N-ATLAS to get the real AI explanation here.`,
    englishGloss: "Placeholder English gloss — the real bilingual explanation arrives with N-ATLAS.",
    examRelevance: input.mode === "exam" ? "Placeholder: WAEC/NECO objective angle will be stated here by N-ATLAS." : "",
    keyPoints: [
      `Topic restated: ${q || "(no question)"}`,
      `Mode: ${input.mode} | Level: ${input.level} | Subject: ${input.subject}`,
      "Real N-ATLAS explanation will appear here once NATLAS_API_BASE_URL + KEY + LLM_PATH are set.",
    ],
    example: "Placeholder example: replace with N-ATLAS-generated Nigerian-context example.",
    commonMistake: "Placeholder: mixing up key terms — N-ATLAS will explain the common mistake.",
    practiceQuestion: {
      question: `Quick check on: ${q || "this topic"}?`,
      options: ["Option A (placeholder)", "Option B (placeholder)", "Option C (placeholder)", "Option D (placeholder)"],
      answer: "Option A (placeholder)",
      explanation: "Placeholder explanation — N-ATLAS will provide the real one.",
    },
  };
}
