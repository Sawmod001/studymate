# N-ATLAS StudyMate — Technical Design Document

## 1. Architecture

```text
Browser
  |
  v
Next.js Web App
  |
  +--> /api/voice
  |       |
  |       +--> N-ATLAS ASR Adapter
  |               |
  |               v
  |          Official N-ATLAS ASR Service
  |
  +--> /api/study
          |
          v
     N-ATLAS LLM Adapter
          |
          v
     Structured Study Response
          |
          v
       Supabase
```

## 2. Recommended Stack
- Next.js 16 App Router
- React
- JavaScript/TypeScript as project preference permits
- Tailwind CSS
- shadcn/ui
- Supabase PostgreSQL
- Zod
- Vercel for web deployment
- N-ATLAS official integration
- GitHub

## 3. Application Structure

```text
app/
  page
  study/page
  history/page
  learn/[id]/page
  quiz/[id]/page
  api/
    study/route
    voice/route
    quiz/route
    history/route

components/
  study/
  voice/
  quiz/
  layout/
  ui/

lib/
  ai/
    natlas.js
    asr.js
    prompts.js
    schemas.js
  db/
  validation/

docs/
evidence/
```

## 4. N-ATLAS Adapter Principle

Never couple UI code directly to the external model implementation.

Use:

```js
generateStudyResponse(input)
transcribeWithNatlas(audio, language)
```

The implementation behind these functions can change after N-ATLAS onboarding without rewriting the product.

## 5. Request Flow

### Text
1. User enters question.
2. Client validates fields.
3. POST `/api/study`.
4. Server builds educational prompt.
5. N-ATLAS generates response.
6. Zod validates structure.
7. Response is saved.
8. UI renders lesson.

### Voice
1. User records audio.
2. Browser uploads audio.
3. POST `/api/voice`.
4. Backend sends audio through official N-ATLAS ASR integration.
5. Transcript is returned.
6. Transcript is passed to N-ATLAS LLM.
7. Structured response is returned.
8. Interaction is logged for validation.

## 6. Security
- Never expose N-ATLAS secrets in browser code.
- Keep credentials in server environment variables.
- Validate file type and size.
- Rate-limit voice and AI requests.
- Do not store raw audio unless necessary and consented.
- Avoid collecting unnecessary personal information.
- Use server-side authorization for database writes.

## 7. Reliability
- Clear loading states.
- Retry only safe transient failures.
- Friendly error states.
- Timeout external requests.
- Preserve transcript separately from generated answer.
- Never fabricate a successful N-ATLAS call.

## 8. Deployment
- Web frontend/API: Vercel or equivalent.
- Database: Supabase.
- N-ATLAS inference: official service/endpoint or approved infrastructure according to challenge onboarding.
