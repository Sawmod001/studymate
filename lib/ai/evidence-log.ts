// Redacted N-ATLAS evidence log (server memory ring buffer).
// Stores integration proof WITHOUT secrets or personal data:
// timestamp, kind (llm/asr), model id, ok, latency ms, error code.
// Powers /api/evidence and the /integration evidence page.
export interface EvidenceEntry {
  at: string;
  kind: "llm" | "asr";
  model: string;
  ok: boolean;
  ms: number;
  code?: string;
}

const MAX = 50;
const buf: EvidenceEntry[] = [];

export function logEvidence(e: Omit<EvidenceEntry, "at">) {
  buf.push({ ...e, at: new Date().toISOString() });
  if (buf.length > MAX) buf.splice(0, buf.length - MAX);
}

export function readEvidence(): EvidenceEntry[] {
  return [...buf].reverse();
}
