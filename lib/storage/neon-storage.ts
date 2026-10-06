// Neon S3-compatible storage helper (server-only).
// Used ONLY for opt-in voice-note archiving (AUDIO_STORAGE_ENABLED=true).
// Credentials live in env, never in code or logs.
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let s3: S3Client | null | undefined;

export function isStorageConfigured(): boolean {
  return Boolean(
    process.env.AWS_ENDPOINT_URL_S3 &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AUDIO_STORAGE_BUCKET
  );
}

export function audioArchivingEnabled(): boolean {
  return process.env.AUDIO_STORAGE_ENABLED === "true" && isStorageConfigured();
}

function getS3(): S3Client | null {
  if (s3 !== undefined) return s3;
  if (!isStorageConfigured()) {
    s3 = null;
    return s3;
  }
  s3 = new S3Client({
    region: process.env.AWS_REGION ?? "eu-central-1",
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
    forcePathStyle: true,
  });
  return s3;
}

// Stores raw audio. Call ONLY with tester consent (the study page states audio
// may be kept for validation when this is on). Key format: audio/<uuid>.webm
export async function archiveAudio(buf: Buffer, key: string, mimeType: string): Promise<void> {
  const client = getS3();
  if (!client) throw new Error("storage-unconfigured");
  await client.send(new PutObjectCommand({
    Bucket: process.env.AUDIO_STORAGE_BUCKET,
    Key: key,
    Body: buf,
    ContentType: mimeType || "audio/webm",
  }));
}

// Short-lived playback URL for evidence review (default 1h). Server-side only.
export async function audioViewUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getS3();
  if (!client) throw new Error("storage-unconfigured");
  return getSignedUrl(client, new GetObjectCommand({ Bucket: process.env.AUDIO_STORAGE_BUCKET, Key: key }), { expiresIn });
}
