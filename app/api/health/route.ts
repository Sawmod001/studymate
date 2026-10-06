import { NextResponse } from "next/server";
import { natlasStatus } from "@/lib/ai/natlas";
import { isAsrConfigured } from "@/lib/ai/asr";
import { isNeonConfigured } from "@/lib/db/neon";
import { isStorageConfigured, audioArchivingEnabled } from "@/lib/storage/neon-storage";

// GET /api/health — config presence + live reachability of the N-ATLAS bridge.
// Never returns secrets. reachable:false means Colab/tunnel is asleep or dead.
export async function GET() {
  const status = natlasStatus();
  let reachable: boolean | null = null;
  let bridgeModel: string | null = null;
  const baseUrl = process.env.NATLAS_API_BASE_URL;
  if (baseUrl) {
    try {
      const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json().catch(() => null) as { model?: string } | null;
        reachable = true;
        bridgeModel = data?.model ?? null;
      } else reachable = false;
    } catch {
      reachable = false;
    }
  }
  return NextResponse.json({
    ok: true,
    natlas: { ...status, keyPreview: undefined, reachable, bridgeModel },
    asr: { configured: isAsrConfigured() },
    db: { provider: "neon", configured: isNeonConfigured() },
    storage: { configured: isStorageConfigured(), audioArchiving: audioArchivingEnabled() },
    auth: { provider: "neon-auth", configured: Boolean(process.env.NEON_AUTH_URL) },
    voice: { enabled: true },
  });
}
