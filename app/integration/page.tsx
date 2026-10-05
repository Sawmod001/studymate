"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";

interface Evidence {
  models: { llm: string; asr: Record<string, string> };
  status: { configured: boolean; baseUrlSet: boolean; keySet: boolean; llmPathSet: boolean; asrPathSet: boolean; model: string };
  calls: Array<{ at: string; kind: string; model: string; ok: boolean; ms: number; code?: string }>;
}

// Public N-ATLAS integration evidence (submission item #2):
// model IDs, adapter wiring, live call log — never any secrets.
export default function IntegrationPage() {
  const [ev, setEv] = useState<Evidence | null>(null);

  useEffect(() => {
    fetch("/api/evidence").then((r) => r.json()).then(setEv).catch(() => {});
  }, []);

  const s = ev?.status;
  const dot = (on: boolean) => (
    <span className={`inline-block h-2.5 w-2.5 rounded-full ${on ? "bg-green-600" : "bg-red-500"}`} />
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <Header />
      <main className="mx-auto max-w-4xl px-6 pb-16">
        <h1 className="text-3xl font-bold">N-ATLAS Integration Evidence</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Where N-ATLAS is used, with what models, and the live call log. No secrets are ever shown here.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
            <h2 className="font-semibold">Configuration</h2>
            <ul className="mt-2 space-y-1 text-sm">
              <li>{dot(!!s?.baseUrlSet)} API base URL {s?.baseUrlSet ? "set" : "missing"}</li>
              <li>{dot(!!s?.keySet)} API key {s?.keySet ? "set" : "missing"}</li>
              <li>{dot(!!s?.llmPathSet)} LLM endpoint path {s?.llmPathSet ? "set" : "missing"}</li>
              <li>{dot(!!s?.asrPathSet)} ASR endpoint path {s?.asrPathSet ? "set" : "missing"}</li>
            </ul>
            {!s?.configured && (
              <p className="mt-2 text-sm text-amber-700">Responses currently use the labeled local placeholder until official keys + paths are pasted into <code>.env.local</code>.</p>
            )}
          </div>
          <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
            <h2 className="font-semibold">Models</h2>
          <p className="text-sm text-zinc-500">
            Public model card: <a href="https://huggingface.co/NCAIR1/N-ATLaS" target="_blank" rel="noopener noreferrer" className="underline">huggingface.co/NCAIR1/N-ATLaS</a> (Llama-3 8B fine-tune; API credentials via shortlist acceleration).
          </p>
            <ul className="mt-2 space-y-1 text-sm">
              <li><code>{ev?.models.llm ?? "…"}</code> — text generation</li>
              {ev && Object.entries(ev.models.asr).map(([lang, m]) => (
                <li key={lang}><code>{m}</code> — ASR ({lang})</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 rounded-xl border bg-white p-4 dark:bg-zinc-900">
          <h2 className="font-semibold">Adapter code (evaluator pointers)</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            <li><code>lib/ai/natlas.ts → generateStudyResponse()</code> — used by <code>POST /api/study</code> and <code>POST /api/voice</code></li>
            <li><code>lib/ai/asr.ts → transcribeWithNatlas()</code> — used by <code>POST /api/voice</code> only</li>
            <li><code>lib/ai/prompts.ts</code> — educational system prompt (bilingual + guardrails)</li>
            <li>No OpenAI/Gemini/Claude fallback exists anywhere in the codebase.</li>
          </ul>
        </div>

        <div className="mt-4 rounded-xl border bg-white p-4 dark:bg-zinc-900">
          <h2 className="font-semibold">Live N-ATLAS call log (this server instance)</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-zinc-500">
                <th className="p-1">Time</th><th className="p-1">Kind</th><th className="p-1">Model</th><th className="p-1">OK</th><th className="p-1">ms</th><th className="p-1">Code</th>
              </tr></thead>
              <tbody>
                {(ev?.calls ?? []).map((c, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-1">{new Date(c.at).toLocaleTimeString()}</td>
                    <td className="p-1">{c.kind}</td><td className="p-1"><code>{c.model}</code></td>
                    <td className="p-1">{c.ok ? "yes" : "no"}</td><td className="p-1">{c.ms}</td><td className="p-1">{c.code ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!ev?.calls?.length && <p className="mt-2 text-sm text-zinc-500">No N-ATLAS calls yet on this instance. Ask a question on <Link href="/study" className="underline">/study</Link> after setting keys.</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
