import { NextResponse } from "next/server";
import { z } from "zod";
import { transcribeWithNatlas, asrModelFor } from "@/lib/ai/asr";
import { logEvidence } from "@/lib/ai/evidence-log";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { generateStudyResponse, buildLocalPlaceholder, type StudyLanguage } from "@/lib/ai/natlas";
import { studyResponseSchema } from "@/lib/ai/schemas";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024; // 10 MB
const langs = ["yo", "ha", "ig", "en-NG", "en"] as const;
const modes = ["explain", "explain-simply", "step-by-step", "example", "practice", "quiz", "translate", "exam"] as const;

// POST /api/voice (multipart): audio + language + academicLevel + subject + mode
// -> official N-ATLAS ASR transcript -> N-ATLAS LLM lesson. Never fakes transcripts.
export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "voice"), 15);
  if (!rl.ok) {
    return NextResponse.json({ success: false, error: { code: "RATE_LIMIT", message: "Too many voice requests. Wait a minute and try again." } }, { status: 429 });
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: { code: "BAD_FORM", message: "Expected multipart form with audio." } }, { status: 400 });
  }

  const meta = z.object({
    language: z.enum(langs),
    academicLevel: z.string().min(1).max(50).default("secondary"),
    subject: z.string().min(1).max(100).default("General"),
    mode: z.enum(modes).default("explain"),
  }).safeParse({
    language: form.get("language"),
    academicLevel: form.get("academicLevel") ?? "secondary",
    subject: form.get("subject") ?? "General",
    mode: form.get("mode") ?? "explain",
  });
  if (!meta.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid language/level/subject/mode." } }, { status: 400 });
  }

  const file = form.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ success: false, error: { code: "NO_AUDIO", message: "No audio file received." } }, { status: 400 });
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ success: false, error: { code: "AUDIO_TOO_LARGE", message: "Audio exceeds 10 MB. Record a shorter question." } }, { status: 413 });
  }
  if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
    return NextResponse.json({ success: false, error: { code: "UNSUPPORTED_AUDIO", message: `Unsupported audio type: ${file.type || "unknown"}.` } }, { status: 415 });
  }

  const { language, academicLevel, subject, mode } = meta.data;
  let transcript: string;
  const tAsr = Date.now();
  try {
    const buf = Buffer.from(await file.arrayBuffer());
    ({ transcript } = await transcribeWithNatlas({
      audio: buf,
      filename: file.name || "question.webm",
      mimeType: file.type || "audio/webm",
      language: language as StudyLanguage,
    }));
    logEvidence({ kind: "asr", model: asrModelFor(language), ok: true, ms: Date.now() - tAsr });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code ?? "ASR_FAILED";
    logEvidence({ kind: "asr", model: asrModelFor(language), ok: false, ms: Date.now() - tAsr, code });
    const status = code.includes("UNCONFIGURED") || code.includes("NOT_IMPLEMENTED") ? 503 : 502;
    const message =
      code.includes("UNCONFIGURED") || code.includes("NOT_IMPLEMENTED")
        ? "Voice ASR not configured. Set NATLAS_API_BASE_URL + NATLAS_API_KEY + NATLAS_ASR_PATH from official onboarding."
        : "Speech transcription failed. Try again or type your question.";
    return NextResponse.json({ success: false, error: { code, message } }, { status });
  }

  // Transcript -> N-ATLAS LLM (or labeled placeholder when LLM path not yet set).
  const model = process.env.NATLAS_LLM_MODEL ?? "NCAIR1/N-ATLaS";
  const tLlm = Date.now();
  try {
    const raw = await generateStudyResponse({ question: transcript, language: language as StudyLanguage, level: academicLevel, subject, mode });
    const valid = studyResponseSchema.safeParse(raw);
    if (!valid.success) {
      logEvidence({ kind: "llm", model, ok: false, ms: Date.now() - tLlm, code: "NATLAS_SCHEMA_MISMATCH" });
      return NextResponse.json({ success: false, error: { code: "NATLAS_SCHEMA_MISMATCH", message: "N-ATLAS returned an unexpected shape." }, transcript }, { status: 502 });
    }
    logEvidence({ kind: "llm", model, ok: true, ms: Date.now() - tLlm });
    return NextResponse.json({ success: true, provider: "natlas", transcript, language, lesson: { id: crypto.randomUUID(), ...valid.data } });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code ?? "NATLAS_UNAVAILABLE";
    logEvidence({ kind: "llm", model, ok: false, ms: Date.now() - tLlm, code });
    if (code === "NATLAS_UNCONFIGURED" || code === "NATLAS_NOT_IMPLEMENTED") {
      const lesson = buildLocalPlaceholder({ question: transcript, language: language as StudyLanguage, level: academicLevel, subject, mode });
      return NextResponse.json({
        success: true,
        provider: "local-placeholder-NOT-NATLAS",
        transcript,
        language,
        notice: "Transcript is genuine N-ATLAS ASR; explanation is a placeholder until NATLAS_LLM_PATH is set.",
        lesson: { id: crypto.randomUUID(), ...lesson },
      });
    }
    return NextResponse.json({ success: false, error: { code, message: "The AI service is temporarily unavailable." }, transcript }, { status: 503 });
  }
}
