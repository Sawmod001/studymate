import { NextResponse } from "next/server";
import { z } from "zod";
import { getNeon, isNeonConfigured } from "@/lib/db/neon";

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
  if (isNeonConfigured()) {
    try {
      const sql = getNeon();
      if (sql) {
        await sql`
          insert into quiz_attempts (lesson_id, score, total, answers)
          values (${parsed.data.lessonId}, ${parsed.data.score}, ${parsed.data.total || entries.length}, ${JSON.stringify(parsed.data.answers)})`;
      }
    } catch { /* device-local lesson id (no FK row) — non-fatal */ }
  }
  return NextResponse.json({
    success: true,
    score: 0,
    total: entries.length,
    feedback: entries.map(([q, a]) => ({ question: q, given: a, note: "Placeholder scoring — N-ATLAS quiz grading pending." })),
  });
}
