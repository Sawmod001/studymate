import { NextResponse } from "next/server";
import { natlasStatus } from "@/lib/ai/natlas";
import { isAsrConfigured } from "@/lib/ai/asr";
import { isNeonConfigured } from "@/lib/db/neon";
import { isStorageConfigured, audioArchivingEnabled } from "@/lib/storage/neon-storage";

// GET /api/health — config presence only. Never returns secrets.
export async function GET() {
  return NextResponse.json({
    ok: true,
    natlas: { ...natlasStatus(), keyPreview: undefined },
    asr: { configured: isAsrConfigured() },
    db: { provider: "neon", configured: isNeonConfigured() },
    storage: { configured: isStorageConfigured(), audioArchiving: audioArchivingEnabled() },
    auth: { provider: "neon-auth", configured: Boolean(process.env.NEON_AUTH_URL) },
    voice: { enabled: true },
  });
}
