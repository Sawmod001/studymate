import Link from "next/link";

export default function Header() {
  return (
    <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
      <Link href="/" className="text-lg font-bold">N-ATLAS StudyMate</Link>
      <nav className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-sm">
        <Link className="underline" href="/study">Study</Link>
        <Link className="underline" href="/history">History</Link>
        <Link className="underline" href="/validation">Validation</Link>
        <Link className="underline" href="/integration">N-ATLAS</Link>
        <Link className="underline" href="/team">Team</Link>
        <Link className="underline" href="/submission">Submit</Link>
      </nav>
    </header>
  );
}
