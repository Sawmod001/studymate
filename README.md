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
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API. Then run `supabase/migrations/0001_studymate.sql` in the SQL editor |
| `NATLAS_API_BASE_URL` + `NATLAS_API_KEY` | Official NCAIR/NAIC onboarding (never invent) |
| `NATLAS_LLM_PATH` | Official LLM endpoint path, e.g. `/v1/chat/completions` — confirm from docs |
| `NATLAS_ASR_PATH` | Official ASR endpoint path, e.g. `/v1/audio/transcriptions` — confirm from docs |
| `NATLAS_LLM_MODEL`, `NATLAS_ASR_*_MODEL` | Pre-filled with `NCAIR1/*` defaults; override only per official docs |

Check status anytime: `GET /api/health` (config presence only, no secrets).

## How it works

- Text: `app/study` → `POST /api/study` → `lib/ai/natlas.ts:generateStudyResponse()` → Zod-validated lesson → localStorage (+ Supabase when keys set).
- Voice: `VoiceRecorder` → `POST /api/voice` (multipart audio ≤10MB) → `lib/ai/asr.ts:transcribeWithNatlas()` → transcript shown + editable → same LLM adapter.
- Feedback: study page form → `POST /api/validate` → `validation_interactions` (Supabase) or accepted-local.
- Without N-ATLAS keys: text answers return `provider:"local-placeholder-NOT-NATLAS"`; voice returns 503 with setup instructions. Nothing fake is ever labeled N-ATLAS.

## Structure

- `app/` — `/`, `/study`, `/history`, `/learn/[id]`, `/quiz/[id]`, `/api/{study,voice,quiz,history,validate,health}`
- `lib/ai/` — `natlas.ts`, `asr.ts`, `prompts.ts`, `schemas.ts` (server-only adapters)
- `lib/db/` — `server.ts` (service-role, null when unconfigured), `client.ts` (browser anon)
- `supabase/migrations/` — run in Supabase SQL editor
- `docs/` — full NAIC spec set (01–16); `evidence/01–07/` — submission folders

## N-ATLAS paths (hosted vs self-host)

- **Path A (hosted API):** use official NCAIR/NAIC credentials in `.env.local`. Fastest if you get them.
- **Path B (self-host):** `inference/` runs the official `NCAIR1/N-ATLaS` weights on your own CUDA GPU and speaks the same contract, so the app works unchanged. See `inference/README.md`.
- Either way, ASR must be the official N-ATLAS ASR service (PS2 key requirement) — the model card ships text weights only.
