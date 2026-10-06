# N-ATLAS StudyMate

Voice + text multilingual AI study assistant for Nigerian learners (NAIC 2026).

## Quick start (keys only — everything else is wired)

```bash
npm install
cp .env.example .env.local   # then fill ONLY the values below
npm run dev
```

Open http://localhost:3000/study.

## Keys to paste into `.env.local`

| Key | Where from |
|---|---|
| `DATABASE_URL` | Neon dashboard → your project → Connection string (pooled). Then run `supabase/migrations/0001_studymate.sql` in the Neon SQL editor |
| `NEON_AUTH_URL` / `NEON_AUTH_JWKS_URL` | Neon dashboard → Auth (optional; anonymous MVP works without login) |
| `AWS_ENDPOINT_URL_S3` + `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` + `AUDIO_STORAGE_BUCKET` | Neon dashboard → Storage → Generate credential. Needed only if `AUDIO_STORAGE_ENABLED=true` |
| `AUDIO_STORAGE_ENABLED` | `false` default. Set `true` only with tester consent to archive voice notes for evidence |
| `NEXT_PUBLIC_SITE_URL` | Your Netlify URL (e.g. `https://studymate.netlify.app`) — fixes sitemap/share links |
| `NATLAS_API_BASE_URL` + `NATLAS_API_KEY` | Official NCAIR/NAIC onboarding (never invent) |
| `NATLAS_LLM_PATH` | Official LLM endpoint path, e.g. `/v1/chat/completions` — confirm from docs |
| `NATLAS_ASR_PATH` | Official ASR endpoint path, e.g. `/v1/audio/transcriptions` — confirm from docs |
| `NATLAS_LLM_MODEL`, `NATLAS_ASR_*_MODEL` | Pre-filled with `NCAIR1/*` defaults; override only per official docs |

Check status anytime: `GET /api/health` (config presence only, no secrets).

## How it works

- Text: `app/study` → `POST /api/study` → `lib/ai/natlas.ts:generateStudyResponse()` → Zod-validated lesson → localStorage (+ Neon when `DATABASE_URL` set).
- Voice: `VoiceRecorder` (mic or audio-file upload) → `POST /api/voice` (multipart audio ≤10MB) → `lib/ai/asr.ts:transcribeWithNatlas()` → transcript shown + editable → same LLM adapter. Raw audio archived to Neon storage only when `AUDIO_STORAGE_ENABLED=true`.
- Feedback: study page form → `POST /api/validate` → `validation_interactions` (Neon) or accepted-local.
- Without N-ATLAS keys: text answers return `provider:"local-placeholder-NOT-NATLAS"`; voice returns 503 with setup instructions. Nothing fake is ever labeled N-ATLAS.

## Structure

- `app/` — `/`, `/study`, `/history`, `/learn/[id]`, `/quiz/[id]`, `/validation`, `/integration`, `/team`, `/submission`, `/api/{study,voice,quiz,history,validate,health,evidence}`
- `lib/ai/` — `natlas.ts`, `asr.ts`, `prompts.ts`, `schemas.ts`, `evidence-log.ts` (server-only adapters)
- `lib/db/neon.ts` — pooled Postgres (null-safe when `DATABASE_URL` missing)
- `lib/storage/neon-storage.ts` — opt-in audio archive (server-only)
- `inference/` — self-host N-ATLAS bridge + Colab guide
- `supabase/migrations/` — schema SQL, run in Neon SQL editor (folder name is legacy)
- `docs/` — full NAIC spec set (01–16); `evidence/01–07/` — submission folders

## Deploy (Netlify)

1. Push to GitHub, import the repo in Netlify (build command + publish come from `netlify.toml`).
2. Site settings → Environment variables → paste every key from `.env.example`, plus `NEXT_PUBLIC_SITE_URL=https://<your-site>.netlify.app`.
3. Deploy → verify `/api/health` on the live URL.

## N-ATLAS paths (hosted vs self-host)

- **Path A (hosted API):** use official NCAIR/NAIC credentials in `.env.local`. Fastest if you get them.
- **Path B (self-host):** `inference/` runs the official `NCAIR1/N-ATLaS` weights on your own CUDA GPU and speaks the same contract, so the app works unchanged. See `inference/README.md`.
- Either way, ASR must be the official N-ATLAS ASR service (PS2 key requirement) — the model card ships text weights only.

## License & attribution (required by the N-ATLaS terms)

Education use is explicitly permitted. Cap: max 1000 active end-users per 30 days
(we are far below; exceeding it needs a commercial license from Awarri/FMCIDE).
Keep this attribution visible: “N-ATLaS is an initiative of the Federal Ministry
of Communications, Innovation and Digital Economy, and powered by Awarri
Technologies.” Derivative renames must carry the suffix “Powered by Awarri.”
