"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <h1 className="text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-zinc-500">Please try again. Your lessons are safe in History.</p>
      <button onClick={reset} className="mt-4 rounded-full bg-black px-6 py-3 text-white dark:bg-white dark:text-black">
        Try again
      </button>
    </div>
  );
}
