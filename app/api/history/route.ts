import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/db/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";

// GET /api/history?sessionKey=... — Supabase when configured, else empty (client localStorage).
export async function GET(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, provider: "localStorage (set Supabase keys to sync)", lessons: [] });
  }
  const { searchParams } = new URL(req.url);
  const sessionKey = searchParams.get("sessionKey");
  try {
    const db = getSupabaseAdmin();
    if (!db) throw new Error("no-db");
    let query = db.from("lessons").select("id,question,input_type,transcript,response,created_at,session_id").order("created_at", { ascending: false }).limit(50);
    if (sessionKey) {
      const { data: sess } = await db.from("study_sessions").select("id").eq("session_key", sessionKey).limit(1).maybeSingle();
      if (sess) query = query.eq("session_id", (sess as { id: string }).id);
    }
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true, provider: "supabase", lessons: data ?? [] });
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

// POST /api/history — persist a lesson (Supabase only; 202 accepted-local otherwise).
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
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, provider: "accepted-local (set Supabase keys to persist)", id: null }, { status: 202 });
  }
  try {
    const db = getSupabaseAdmin();
    if (!db) throw new Error("no-db");
    const v = parsed.data;
    const { data: sess, error: sErr } = await db.from("study_sessions")
      .upsert({ session_key: v.sessionKey, language: v.language, academic_level: v.academicLevel, subject: v.subject }, { onConflict: "session_key" })
      .select("id").single();
    if (sErr) throw sErr;
    const { data: lesson, error: lErr } = await db.from("lessons").insert({
      session_id: (sess as { id: string }).id,
      question: v.question,
      input_type: v.inputType,
      transcript: v.transcript || null,
      response: v.lesson,
    }).select("id").single();
    if (lErr) throw lErr;
    return NextResponse.json({ success: true, provider: "supabase", id: (lesson as { id: string }).id });
  } catch {
    return NextResponse.json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Could not save lesson." } }, { status: 503 });
  }
}
