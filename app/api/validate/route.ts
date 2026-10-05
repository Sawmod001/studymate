import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/db/server";
import { rateLimit, clientKey } from "@/lib/rate-limit";

// POST /api/validate — validation interaction log per 05-VALIDATION.md.
// Works without Supabase (202 accepted-local) so field testing isn't blocked.
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

// GET /api/validate — validation rows for the dashboard (Supabase only).
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, provider: "localStorage (set Supabase keys to sync)", interactions: [] });
  }
  try {
    const db = getSupabaseAdmin();
    if (!db) throw new Error("no-db");
    const { data, error } = await db.from("validation_interactions").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) throw error;
    return NextResponse.json({ success: true, provider: "supabase", interactions: data ?? [] });
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
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ success: true, provider: "accepted-local (set Supabase keys to persist)", id: null }, { status: 202 });
  }
  try {
    const db = getSupabaseAdmin();
    if (!db) throw new Error("no-db");
    const v = parsed.data;
    const { data, error } = await db.from("validation_interactions").insert({
      language: v.language,
      input_type: v.inputType,
      subject: v.subject || null,
      academic_level: v.academicLevel || null,
      transcription_success: v.transcriptionSuccess,
      usefulness: v.usefulness ?? null,
      clarity: v.clarity ?? null,
      user_correction: v.userCorrection,
      feedback: v.feedback || null,
    }).select("id").single();
    if (error) throw error;
    return NextResponse.json({ success: true, provider: "supabase", id: (data as { id: string }).id });
  } catch {
    return NextResponse.json({ success: false, error: { code: "DB_UNAVAILABLE", message: "Could not save feedback." } }, { status: 503 });
  }
}
