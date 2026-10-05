import { NextResponse } from "next/server";
import { natlasStatus } from "@/lib/ai/natlas";
import { isAsrConfigured } from "@/lib/ai/asr";
import { isSupabaseConfigured } from "@/lib/db/server";

// GET /api/health — config presence only. Never returns secrets.
export async function GET() {
  return NextResponse.json({
    ok: true,
    natlas: { ...natlasStatus(), keyPreview: undefined },
    asr: { configured: isAsrConfigured() },
    supabase: { configured: isSupabaseConfigured() },
    voice: { enabled: true },
  });
}
