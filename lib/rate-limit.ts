// Simple in-memory rate limiter (per-IP, per-route bucket). No dependency.
// For MVP scale; replace with Upstash/Vercel KV if traffic grows.
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit = 20, windowMs = 60_000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, remaining: 0 };
  }
  hits.push(now);
  buckets.set(key, hits);
  // Prevent unbounded growth
  if (buckets.size > 5000) buckets.clear();
  return { ok: true, remaining: limit - hits.length };
}

export function clientKey(req: Request, route: string): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return `${route}:${ip}`;
}
