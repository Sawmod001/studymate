// Neon Postgres layer (server-only). Uses DATABASE_URL (pooled connection).
// Never import into client components — the connection string is secret.
// Returns null when unconfigured so routes degrade to accepted-local.
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null | undefined;

export function isNeonConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getNeon(): NeonQueryFunction<false, false> | null {
  if (client !== undefined) return client;
  if (!process.env.DATABASE_URL) {
    client = null;
    return client;
  }
  client = neon(process.env.DATABASE_URL);
  return client;
}
