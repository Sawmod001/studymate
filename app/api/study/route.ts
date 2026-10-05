import { NextResponse } from "next/server";
import { studyRequestSchema, studyResponseSchema } from "@/lib/ai/schemas";
import { buildLocalPlaceholder, generateStudyResponse, isNatlasConfigured } from "@/lib/ai/natlas";
import { logEvidence } from "@/lib/ai/evidence-log";
import { rateLimit, clientKey } from "@/lib/rate-limit";

// POST /api/study — text explain/translate/exam (voice has its own route).
export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "study"), 30);
  if (!rl.ok) {
    return NextResponse.json({ success: false, error: { code: "RATE_LIMIT", message: "Too many requests. Wait a minute and try again." } }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: "BAD_JSON", message: "Invalid JSON body." } }, { status: 400 });
  }
  const parsed = studyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid request.", issues: parsed.error.flatten() } }, { status: 400 });
  }
  const { question, language, academicLevel, subject, mode } = parsed.data;
  const model = process.env.NATLAS_LLM_MODEL ?? "NCAIR1/N-ATLaS";

  if (isNatlasConfigured()) {
    const t0 = Date.now();
    try {
      const lesson = await generateStudyResponse({ question, language, level: academicLevel, subject, mode });
      const valid = studyResponseSchema.safeParse(lesson);
      if (!valid.success) {
        logEvidence({ kind: "llm", model, ok: false, ms: Date.now() - t0, code: "NATLAS_SCHEMA_MISMATCH" });
        return NextResponse.json({ success: false, error: { code: "NATLAS_SCHEMA_MISMATCH", message: "N-ATLAS returned an unexpected shape." } }, { status: 502 });
      }
      logEvidence({ kind: "llm", model, ok: true, ms: Date.now() - t0 });
      return NextResponse.json({ success: true, provider: "natlas", lesson: { id: crypto.randomUUID(), ...valid.data } });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code ?? "NATLAS_UNAVAILABLE";
      logEvidence({ kind: "llm", model, ok: false, ms: Date.now() - t0, code });
      return NextResponse.json({ success: false, error: { code, message: "The AI service is temporarily unavailable." } }, { status: 503 });
    }
  }

  // No keys yet: return clearly-labeled local placeholder so UI is testable
  // without ever claiming N-ATLAS. Evaluators see provider:"local-placeholder".
  const lesson = buildLocalPlaceholder({ question, language, level: academicLevel, subject, mode });
  return NextResponse.json({
    success: true,
    provider: "local-placeholder-NOT-NATLAS",
    notice: "N-ATLAS not configured. Set NATLAS_API_BASE_URL + NATLAS_API_KEY + NATLAS_LLM_PATH from official onboarding to get genuine responses.",
    lesson: { id: crypto.randomUUID(), ...lesson },
  });
}
