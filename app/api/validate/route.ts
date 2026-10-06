import { NextResponse } from "next/server";
import { z } from "zod";
import { getNeon, isNeonConfigured } from "@/lib/db/neon";
import { rateLimit, clientKey } from "@/lib/rate-limit";

// POST /api/validate — validation interaction log per 05-VALIDATION.md.
// Works without Neon (202 accepted-local) so field testing isn't blocked.
const schema = z.object({
  language: z.string().min(1).max(16),
  inputType: z.enum(["voice", "text"]),
  subject: z.string().max(100).optional().default(""),
  academicLevel: z.string().max(50).optional().default(""),
  transcriptionSuccess: z.enum(["yes", "partly", "no"]).optional().default("yes"),
  usefulness: z.number().int().min(1).max(5).optional(),
  clarity: z.enum(["yes", "partly", "no"]).optional(),
  userCorrection: z.boolean().optional().default(false),
  feedback: z.string().max(1000).optional().default(""),
});

// GET /api/validate — validation rows for the dashboard (Neon only).
export async function GET() {
  if (!isNeonConfigured()) {
    return NextResponse.json({ success: true, provider: "localStorage (set DATABASE_URL to sync)", interactions: [] });
  }
  try {
    const sql = getNeon();
    if (!sql) throw new Error("no-db");
    const rows = await sql`select * from validation_interactions order by created_at desc limit 500`;
    return NextResponse.json({ success: true, provider: "neon", interactions: rows });
  } catch {
    return NextResponse.json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Could not load validation data." } }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "validate"), 30);
  if (!rl.ok) {
    return NextResponse.json({ success: false, error: { code: "RATE_LIMIT", message: "Too many requests." } }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid feedback payload." } }, { status: 400 });
  }
  if (!isNeonConfigured()) {
    return NextResponse.json({ success: true, provider: "accepted-local (set DATABASE_URL to persist)", id: null }, { status: 202 });
  }
  try {
    const sql = getNeon();
    if (!sql) throw new Error("no-db");
    const v = parsed.data;
    const rows = await sql`
      insert into validation_interactions (language, input_type, subject, academic_level, transcription_success, usefulness, clarity, user_correction, feedback)
      values (${v.language}, ${v.inputType}, ${v.subject || null}, ${v.academicLevel || null}, ${v.transcriptionSuccess}, ${v.usefulness ?? null}, ${v.clarity ?? null}, ${v.userCorrection}, ${v.feedback || null})
      returning id`;
    return NextResponse.json({ success: true, provider: "neon", id: (rows[0] as { id: string }).id });
  } catch {
    return NextResponse.json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Could not save feedback." } }, { status: 503 });
  }
}
