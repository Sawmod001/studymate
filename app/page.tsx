import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <span className="text-lg font-bold">N-ATLAS StudyMate</span>
        <nav className="flex gap-4 text-sm">
          <Link className="underline" href="/study">Study</Link>
          <Link className="underline" href="/history">History</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-6 pb-16">
        <section className="py-10">
          <p className="mb-2 inline-block rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">
            N-ATLAS integration key-ready — paste keys into .env.local to go live
          </p>
          <h1 className="text-4xl font-bold leading-tight">Understand anything, in your language.</h1>
          <p className="mt-3 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
            Ask by voice or text in Yoruba, Hausa, Igbo or Nigerian English. Speech goes through the
            official N-ATLAS ASR adapter; answers come from the N-ATLAS LLM adapter.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/study" className="rounded-full bg-black px-6 py-3 font-medium text-white dark:bg-white dark:text-black">
              Ask by Voice or Text
            </Link>
          </div>
          <p className="mt-3 text-sm text-zinc-500">Supported: Yoruba • Hausa • Igbo • Nigerian English • English</p>
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          {[
            ["1. Ask", "Record voice or type. Correct the transcript if needed."],
            ["2. Learn", "Explanation, key points, example + common mistake."],
            ["3. Practice", "Practice question, quiz mode, simpler / step-by-step."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
              <h2 className="font-semibold">{t}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{d}</p>
            </div>
          ))}
        </section>
        <section className="mt-8 rounded-xl border bg-white p-5 dark:bg-zinc-900">
          <h2 className="font-semibold">Validation &amp; impact</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Every answer can be rated for usefulness and transcript accuracy. Results feed the{" "}
            <Link href="/validation" className="underline">validation dashboard</Link> (totals, ASR success,
            per-language breakdown, anonymized CSV export) — the evidence base for the NAIC submission.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link href="/study" className="rounded-full border px-4 py-2">Try a lesson →</Link>
            <Link href="/validation" className="rounded-full border px-4 py-2">View validation →</Link>
          </div>
        </section>
        <footer className="mt-12 border-t pt-4 text-sm text-zinc-500">
          NAIC 2026. Copy <code>.env.example</code> to <code>.env.local</code> and fill Supabase + N-ATLAS keys. See README + /docs.
        </footer>
      </main>
    </div>
  );
}
