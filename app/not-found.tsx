import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-zinc-500">That page doesn&apos;t exist.</p>
      <Link href="/study" className="mt-4 inline-block rounded-full bg-black px-6 py-3 text-white dark:bg-white dark:text-black">
        Back to Study
      </Link>
    </div>
  );
}
