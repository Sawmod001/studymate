"use client";
import { useState } from "react";

// Share a lesson: WhatsApp (how Nigerian testers share) + copy link.
// Links to /learn/[id]; works for validation drive without accounts.
export default function ShareButtons({ lessonId, title }: { lessonId: string; title: string }) {
  const [copied, setCopied] = useState(false);

  function url() {
    return `${window.location.origin}/learn/${lessonId}`;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`StudyMate: ${title} — ${typeof window !== "undefined" ? url() : ""}`)}`}
        target="_blank" rel="noopener noreferrer"
        className="rounded-full border px-4 py-2 text-sm"
      >
        Share on WhatsApp
      </a>
      <button onClick={copy} className="rounded-full border px-4 py-2 text-sm">
        {copied ? "✓ Copied!" : "Copy lesson link"}
      </button>
    </div>
  );
}
