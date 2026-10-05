import { NextResponse } from "next/server";
import { readEvidence } from "@/lib/ai/evidence-log";
import { natlasStatus } from "@/lib/ai/natlas";
import { asrModelFor } from "@/lib/ai/asr";

// GET /api/evidence — public integration proof (no secrets, ever).
export async function GET() {
  return NextResponse.json({
    ok: true,
    models: {
      llm: process.env.NATLAS_LLM_MODEL ?? "NCAIR1/N-ATLaS",
      asr: {
        yo: asrModelFor("yo"), ha: asrModelFor("ha"),
        ig: asrModelFor("ig"), en: asrModelFor("en-NG"),
      },
    },
    status: natlasStatus(),
    calls: readEvidence(),
  });
}
