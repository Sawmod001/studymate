import Header from "@/components/layout/Header";
import { TEAM, teamComplete } from "@/lib/team";

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <Header />
      <main className="mx-auto max-w-3xl px-6 pb-16">
        <h1 className="text-3xl font-bold">Team</h1>
        {!teamComplete() && (
          <p className="mt-2 rounded bg-amber-100 p-2 text-sm text-amber-900">
            Placeholder profiles — edit <code>lib/team.ts</code> with real names, roles and bios before submission.
          </p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {TEAM.map((m) => (
            <div key={m.name + m.role} className="rounded-xl border bg-white p-4 dark:bg-zinc-900">
              <h2 className="font-bold">{m.name}</h2>
              <p className="text-sm text-zinc-500">{m.role}</p>
              <p className="mt-2 text-sm"><span className="font-medium">Built:</span> {m.responsibility}</p>
              <p className="mt-1 text-sm">{m.bio}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
