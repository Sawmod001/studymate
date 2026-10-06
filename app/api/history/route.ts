import { NextResponse } from "next/server";
import { z } from "zod";
import { getNeon, isNeonConfigured } from "@/lib/db/neon";
import { rateLimit, clientKey } from "@/lib/rate-limit";

// GET /api/history?sessionKey=... — Neon when configured (session-scoped, so
// testers only ever see their own lessons). sessionKey is REQUIRED when the DB
// is live; without keys the client uses device localStorage.
export async function GET(req: Request) {
  if (!isNeonConfigured()) {
    return NextResponse.json({ success: true, provider: "localStorage (set DATABASE_URL to sync)", lessons: [] });
  }
  const { searchParams } = new URL(req.url);
  const sessionKey = searchParams.get("sessionKey");
  if (!sessionKey) {
    return NextResponse.json({ success: false, error: { code: "SESSION_REQUIRED", message: "sessionKey query param is required." } }, { status: 400 });
  }
  try {
    const sql = getNeon();
    if (!sql) throw new Error("no-db");
    const rows = await sql`
      select l.id, l.question, l.input_type, l.transcript, l.response, l.created_at
      from lessons l join study_sessions s on s.id = l.session_id
      where s.session_key = ${sessionKey}
      order by l.created_at desc limit 50`;
    return NextResponse.json({ success: true, provider: "neon", lessons: rows });
  } catch {
    return NextResponse.json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Could not load history." } }, { status: 503 });
  }
}

const saveSchema = z.object({
  sessionKey: z.string().min(1).max(100),
  language: z.string().min(1).max(16),
  academicLevel: z.string().min(1).max(50),
  subject: z.string().min(1).max(100),
  question: z.string().min(1).max(2000),
  inputType: z.enum(["voice", "text"]),
  transcript: z.string().max(2000).optional().default(""),
  lesson: z.record(z.string(), z.unknown()),
});

// POST /api/history — persist a lesson (Neon only; 202 accepted-local otherwise).
export async function POST(req: Request) {
  const rl = rateLimit(clientKey(req, "history"), 30);
  if (!rl.ok) {
    return NextResponse.json({ success: false, error: { code: "RATE_LIMIT", message: "Too many requests." } }, { status: 429 });
  }
  const body = await req.json().catch(() => null);
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid lesson payload." } }, { status: 400 });
  }
  if (!isNeonConfigured()) {
    return NextResponse.json({ success: true, provider: "accepted-local (set DATABASE_URL to persist)", id: null }, { status: 202 });
  }
  try {
    const sql = getNeon();
    if (!sql) throw new Error("no-db");
    const v = parsed.data;
    const sess = await sql`
      insert into study_sessions (session_key, language, academic_level, subject)
      values (${v.sessionKey}, ${v.language}, ${v.academicLevel}, ${v.subject})
      on conflict (session_key) do update set language = excluded.language
      returning id`;
    const lesson = await sql`
      insert into lessons (session_id, question, input_type, transcript, response)
      values (${(sess[0] as { id: string }).id}, ${v.question}, ${v.inputType}, ${v.transcript || null}, ${JSON.stringify(v.lesson)})
      returning id`;
    return NextResponse.json({ success: true, provider: "neon", id: (lesson[0] as { id: string }).id });
  } catch {
    return NextResponse.json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Could not save lesson." } }, { status: 503 });
  }
}
