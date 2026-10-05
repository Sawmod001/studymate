import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/db/server";

const quizSchema = z.object({
  lessonId: z.string().min(1),
  answers: z.record(z.string(), z.string()),
  score: z.number().int().min(0).optional().default(0),
  total: z.number().int().min(0).optional().default(0),
});

// POST /api/quiz — echo scoring + best-effort quiz_attempts persistence.
// Never fails the request when the lesson id is device-local (no FK row).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = quizSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "lessonId + answers required." } }, { status: 400 });
  }
  const entries = Object.entries(parsed.data.answers);
  if (isSupabaseConfigured()) {
    try {
      const db = getSupabaseAdmin();
      if (db) {
        await db.from("quiz_attempts").insert({
          lesson_id: parsed.data.lessonId,
          score: parsed.data.score,
          total: parsed.data.total || entries.length,
          answers: parsed.data.answers,
        });
      }
    } catch { /* device-local lesson id or RLS — non-fatal */ }
  }
  return NextResponse.json({
    success: true,
    score: 0,
    total: entries.length,
    feedback: entries.map(([q, a]) => ({ question: q, given: a, note: "Placeholder scoring — N-ATLAS quiz grading pending." })),
  });
}
