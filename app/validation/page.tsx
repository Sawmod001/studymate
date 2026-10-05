"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { loadValidationLocal, type ValidationEntry } from "@/lib/validation/store";

interface Row extends ValidationEntry { id?: string; source: "device" | "supabase" }

function Bar({ label, pct, value }: { label: string; pct: number; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr_60px] items-center gap-2 text-sm">
      <span className="truncate">{label}</span>
      <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-700">
        <div className="h-3 rounded bg-black dark:bg-white" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </div>
      <span className="text-right text-zinc-500">{value}</span>
    </div>
  );
}

export default function ValidationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [provider, setProvider] = useState("device");

  useEffect(() => {
    const local: Row[] = loadValidationLocal().map((e) => ({ ...e, source: "device" as const }));
    setRows(local);
    fetch("/api/validate").then((r) => r.json()).then((d) => {
      if (d.success && Array.isArray(d.interactions) && d.interactions.length) {
        const mapped: Row[] = d.interactions.map((x: Record<string, unknown>, i: number) => ({
          id: String(x.id ?? `sb-${i}`),
          date: String(x.created_at ?? ""),
          language: String(x.language ?? ""),
          inputType: (x.input_type as "voice" | "text") ?? "text",
          subject: String(x.subject ?? ""),
          academicLevel: String(x.academic_level ?? ""),
          transcriptionSuccess: (x.transcription_success as Row["transcriptionSuccess"]) ?? "yes",
          usefulness: Number(x.usefulness ?? 0),
          clarity: (x.clarity as Row["clarity"]) ?? "yes",
          userCorrection: Boolean(x.user_correction),
          source: "supabase" as const,
        }));
        setRows([...mapped, ...local]);
        setProvider("supabase+device");
      } else if (d.provider) setProvider(String(d.provider));
    }).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const voice = rows.filter((r) => r.inputType === "voice").length;
    const useful = rows.map((r) => r.usefulness).filter((u) => u >= 1 && u <= 5);
    const avg = useful.length ? (useful.reduce((a, b) => a + b, 0) / useful.length) : 0;
    const voiceRows = rows.filter((r) => r.inputType === "voice");
    const asrOk = voiceRows.filter((r) => r.transcriptionSuccess === "yes").length;
    const corrections = rows.filter((r) => r.userCorrection).length;
    const langs = [...new Set(rows.map((r) => r.language).filter(Boolean))];
    const byLang = langs.map((l) => ({ l, n: rows.filter((r) => r.language === l).length }));
    const subjects: Record<string, number> = {};
    rows.forEach((r) => { if (r.subject) subjects[r.subject] = (subjects[r.subject] ?? 0) + 1; });
    const bySubj = Object.entries(subjects).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return { total, voice, avg, voiceRows: voiceRows.length, asrOk, corrections, langs, byLang, bySubj };
  }, [rows]);

  function exportCsv() {
    const head = "date,language,input_type,subject,academic_level,transcription_success,usefulness,clarity,user_correction";
    const lines = rows.map((r) => [r.date, r.language, r.inputType, r.subject, r.academicLevel, r.transcriptionSuccess, r.usefulness, r.clarity, r.userCorrection].map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[head, ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "studymate-validation-anonymized.csv";
    a.click();
  }

  const cards: Array<[string, string]> = [
    ["Total interactions", `${stats.total} / 50 target`],
    ["Voice share", stats.total ? `${Math.round((stats.voice / stats.total) * 100)}% (${stats.voice})` : "—"],
    ["Avg usefulness", stats.avg ? `${stats.avg.toFixed(1)} / 5` : "—"],
    ["ASR success", stats.voiceRows ? `${Math.round((stats.asrOk / stats.voiceRows) * 100)}% (${stats.asrOk}/${stats.voiceRows})` : "—"],
    ["Corrections", `${stats.corrections}`],
    ["Languages", stats.langs.length ? stats.langs.join(", ") : "—"],
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <Header />
      <main className="mx-auto max-w-4xl px-6 pb-16">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Validation</h1>
          <button onClick={exportCsv} disabled={!rows.length} className="rounded-full border px-4 py-2 text-sm disabled:opacity-40">Export CSV</button>
        </div>
        <p className="mt-1 text-sm text-zinc-500">Source: {provider} • Real interactions only — never fabricate (05-VALIDATION.md).</p>
        <div className="mt-4 rounded-xl border bg-white p-4 dark:bg-zinc-900">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">NAIC Voice-First goal: 50 real interactions</span>
            <span>{Math.min(stats.total, 50)}/50</span>
          </div>
          <div className="mt-2 h-4 rounded-full bg-zinc-200 dark:bg-zinc-700">
            <div className="h-4 rounded-full bg-green-600" style={{ width: `${Math.min(100, (stats.total / 50) * 100)}%` }} />
          </div>
          {stats.total < 50 && <p className="mt-1 text-sm text-zinc-500">{50 - stats.total} to go — share /study with testers (see tester kit below).</p>}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {cards.map(([t, v]) => (
            <div key={t} className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
              <p className="text-sm text-zinc-500">{t}</p>
              <p className="mt-1 text-xl font-bold">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
            <h2 className="font-semibold">By language</h2>
            <div className="mt-2 grid gap-2">
              {stats.byLang.map(({ l, n }) => <Bar key={l} label={l} pct={stats.total ? (n / stats.total) * 100 : 0} value={`${n}`} />)}
              {!stats.byLang.length && <p className="text-sm text-zinc-500">No data yet — run interactions on /study.</p>}
            </div>
          </div>
          <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
            <h2 className="font-semibold">Top subjects</h2>
            <div className="mt-2 grid gap-2">
              {stats.bySubj.map(([s, n]) => <Bar key={s} label={s} pct={(n / Math.max(1, stats.total)) * 100} value={`${n}`} />)}
              {!stats.bySubj.length && <p className="text-sm text-zinc-500">No data yet.</p>}
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-xl border bg-white p-4 dark:bg-zinc-900">
          <h2 className="font-semibold">Recent interactions</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-zinc-500">
                <th className="p-1">Date</th><th className="p-1">Lang</th><th className="p-1">Type</th><th className="p-1">Subject</th><th className="p-1">ASR</th><th className="p-1">Useful</th><th className="p-1">Fixed</th>
              </tr></thead>
              <tbody>
                {rows.slice(0, 30).map((r, i) => (
                  <tr key={r.id ?? i} className="border-t">
                    <td className="p-1">{r.date ? new Date(r.date).toLocaleString() : "—"}</td>
                    <td className="p-1">{r.language}</td><td className="p-1">{r.inputType}</td>
                    <td className="p-1">{r.subject}</td><td className="p-1">{r.transcriptionSuccess}</td>
                    <td className="p-1">{r.usefulness || "—"}</td><td className="p-1">{r.userCorrection ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && <p className="mt-2 text-sm text-zinc-500">Nothing logged yet. <Link href="/study" className="underline">Start on /study</Link>.</p>}
          </div>
        </div>
        <TesterKit />
        <p className="mt-4 text-xs text-zinc-500">
          Privacy: interactions log language, subject, scores and transcript outcomes only — no names, phone numbers or student IDs.
          Raw audio is never stored. Records are kept only for challenge evidence and product improvement.
        </p>
      </main>
    </div>
  );
}

function TesterKit() {
  const [origin, setOrigin] = useState("");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const studyUrl = origin ? `${origin}/study` : "/study";
  const qr = origin ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(studyUrl)}` : "";
  return (
    <div className="mt-4 rounded-xl border bg-white p-4 dark:bg-zinc-900">
      <h2 className="font-semibold">📣 Tester kit (reach 50 fast)</h2>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        {qr && <img src={qr} alt="QR code to the study page" width={160} height={160} className="rounded border" />}
        <div className="text-sm">
          <p>1. Print or show this QR — testers scan it to open /study.</p>
          <p>2. Each tester asks a question (voice preferred) and taps “Send feedback”.</p>
          <p>3. Track progress on the goal bar above; export the CSV for submission.</p>
          <p className="mt-2 break-all text-zinc-500">{studyUrl}</p>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Try StudyMate and help us test: ${studyUrl}`)}`}
            target="_blank" rel="noopener noreferrer" className="mt-2 inline-block rounded-full border px-4 py-2"
          >
            Invite testers on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
