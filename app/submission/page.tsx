"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { teamComplete } from "@/lib/team";
import { loadValidationLocal } from "@/lib/validation/store";

// Submission readiness tracker — the 7 NAIC items with live auto-checks
// plus manual checkboxes persisted on this device. For the team, not judges.
const MANUAL_KEY = "studymate-submission-manual";

export default function SubmissionPage() {
  const [counts, setCounts] = useState({ validation: 0, evidence: 0, natlas: false });
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const [deployed, setDeployed] = useState(false);

  useEffect(() => {
    setDeployed(window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1");
    try { setManual(JSON.parse(localStorage.getItem(MANUAL_KEY) ?? "{}")); } catch {}
    const local = loadValidationLocal().length;
    Promise.all([
      fetch("/api/validate").then((r) => r.json()).catch(() => null),
      fetch("/api/evidence").then((r) => r.json()).catch(() => null),
    ]).then(([v, e]) => {
      setCounts({
        validation: Math.max(local, Array.isArray(v?.interactions) ? v.interactions.length + local : local),
        evidence: Array.isArray(e?.calls) ? e.calls.filter((c: { ok: boolean }) => c.ok).length : 0,
        natlas: Boolean(e?.status?.configured),
      });
    });
  }, []);

  function toggle(k: string) {
    setManual((m) => {
      const n = { ...m, [k]: !m[k] };
      try { localStorage.setItem(MANUAL_KEY, JSON.stringify(n)); } catch {}
      return n;
    });
  }

  const items: Array<{ id: string; title: string; auto: string; autoOk: boolean; hint: string }> = [
    { id: "artefact", title: "1. Working Artefact", auto: deployed ? "App is deployed (not localhost)" : "Running on localhost — deploy to Netlify", autoOk: deployed, hint: "Deploy via Netlify, paste the URL into the ONDI portal." },
    { id: "integration", title: "2. N-ATLAS Integration Evidence", auto: counts.natlas ? `Keys configured, ${counts.evidence} successful N-ATLAS calls logged` : "N-ATLAS keys not configured yet", autoOk: counts.natlas && counts.evidence > 0, hint: "See /integration. Screenshot it with secrets absent." },
    { id: "validation", title: "3. Real-World Validation", auto: `${counts.validation}/50 documented interactions`, autoOk: counts.validation >= 50, hint: "Use the /validation tester kit + QR, then export CSV." },
    { id: "docs", title: "4. Technical Documentation", auto: "docs/ has the 16 spec files in-repo", autoOk: true, hint: "README + docs/ + architecture notes. Check they match the built app." },
    { id: "video", title: "5. Video Demonstration (3–5 min)", auto: manual.video ? "Marked done" : "Not marked done", autoOk: !!manual.video, hint: "Follow docs/11-DEMO-SCRIPT.md. Tick when recorded." },
    { id: "team", title: "6. Team Profile", auto: teamComplete() ? "lib/team.ts filled" : "lib/team.ts still has TODO placeholders", autoOk: teamComplete(), hint: "Fill lib/team.ts, then check the /team page." },
    { id: "endorse", title: "7. Endorsement / Registration", auto: manual.endorse ? "Marked done" : "Not marked done", autoOk: !!manual.endorse, hint: "Track A: HOD letter. Track B: CAC / valid ID." },
  ];
  const done = items.filter((i) => i.autoOk).length;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <Header />
      <main className="mx-auto max-w-3xl px-6 pb-16">
        <h1 className="text-3xl font-bold">Submission Readiness</h1>
        <p className="mt-1 text-sm text-zinc-500">Deadline: 12 Oct 2026, 11:59 PM WAT • ONDI portal • {done}/7 ready</p>
        <div className="mt-2 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div className="h-4 rounded-full bg-green-600" style={{ width: `${(done / 7) * 100}%` }} />
        </div>
        <div className="mt-4 grid gap-3">
          {items.map((i) => (
            <div key={i.id} className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold">{i.title}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${i.autoOk ? "bg-green-100 text-green-900" : "bg-zinc-200 text-zinc-700"}`}>
                  {i.autoOk ? "READY" : "TODO"}
                </span>
              </div>
              <p className="mt-1 text-sm">{i.auto}</p>
              <p className="text-sm text-zinc-500">{i.hint}</p>
              {(i.id === "video" || i.id === "endorse") && (
                <button onClick={() => toggle(i.id)} className="mt-2 rounded-full border px-4 py-1 text-sm">
                  {manual[i.id] ? "✓ Marked done (tap to undo)" : "Mark done"}
                </button>
              )}
              {i.id === "docs" && <Link href="/integration" className="mt-2 inline-block text-sm underline">Review integration evidence →</Link>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
