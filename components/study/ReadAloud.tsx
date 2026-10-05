"use client";
import { useEffect, useState } from "react";

// Browser read-aloud (Web Speech API). Explicitly NOT N-ATLAS — labeled as such.
// Best-effort voice matching per language; degrades gracefully when unavailable.
const LANG_TAG: Record<string, string[]> = {
  yo: ["yo", "yor"], ha: ["ha", "hau"], ig: ["ig", "ibo"],
  "en-NG": ["en-NG", "en_NG", "en"], en: ["en"],
};

export default function ReadAloud({ text, language }: { text: string; language: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported("speechSynthesis" in window);
    return () => { try { window.speechSynthesis.cancel(); } catch {} };
  }, []);

  function pickVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    const tags = LANG_TAG[language] ?? ["en"];
    for (const t of tags) {
      const v = voices.find((v) => v.lang.toLowerCase().startsWith(t.toLowerCase()));
      if (v) return v;
    }
    return voices.find((v) => v.lang.toLowerCase().startsWith("en")) ?? null;
  }

  function toggle() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  }

  if (!supported) return null;
  return (
    <button onClick={toggle} className="rounded-full border px-4 py-2 text-sm" title="Browser read-aloud, not N-ATLAS">
      {speaking ? "⏹ Stop reading" : "🔊 Read aloud"}
    </button>
  );
}
