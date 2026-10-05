# Master AI Coding Prompt — N-ATLAS StudyMate

You are the senior software engineer building **N-ATLAS StudyMate**, a production-quality MVP for the NITDA/NCAIR National AI Innovation Challenge.

## Objective
Build a voice-first multilingual AI study assistant for Nigerian learners.

The critical requirement is genuine N-ATLAS integration.

## Rules
1. Do not replace N-ATLAS with OpenAI, Gemini, Claude, or another general-purpose LLM.
2. Do not invent an N-ATLAS API endpoint.
3. If endpoint details are not supplied, create a clean adapter with TODO configuration and stop before pretending the external call works.
4. Never expose secrets to the browser.
5. Use server-side API routes for model calls.
6. Keep code modular.
7. Do not add unnecessary agents, RAG, vector databases, MCP, or fine-tuning.
8. Do not add authentication unless it is actually needed.
9. Use anonymous sessions for MVP.
10. Do not collect unnecessary personal data.
11. Do not build fake validation metrics.

## Stack
- Next.js 16 App Router
- React
- Tailwind
- shadcn/ui where useful
- Supabase PostgreSQL
- Zod
- N-ATLAS
- Vercel

## Pages
- `/`
- `/study`
- `/learn/[id]`
- `/quiz/[id]`
- `/history`

## API
- POST `/api/study`
- POST `/api/voice`
- POST `/api/quiz`
- GET `/api/history`

## AI Adapter
Create:
- `lib/ai/natlas.js`
- `lib/ai/asr.js`
- `lib/ai/prompts.js`
- `lib/ai/schemas.js`

Use functions:
```js
generateStudyResponse()
transcribeWithNatlas()
```

## Study Response
Validate this structure:

```json
{
  "title": "string",
  "explanation": "string",
  "keyPoints": ["string"],
  "example": "string",
  "commonMistake": "string",
  "practiceQuestion": {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "answer": "string",
    "explanation": "string"
  }
}
```

## Voice
Support:
- Yoruba
- Hausa
- Igbo
- Nigerian English

Use the official N-ATLAS ASR service required by the challenge.

## UI
The interface must make voice the primary interaction while still supporting text.

Include:
- language selector
- academic level
- subject
- large voice recorder
- transcript
- answer
- key points
- example
- practice
- feedback

## Error Handling
Implement clear states:
- Recording error
- Unsupported audio
- ASR failure
- N-ATLAS failure
- Validation failure
- Database failure
- Rate limit

## Database
Create:
- study_sessions
- lessons
- quiz_attempts
- validation_interactions

## Development Order
Phase 1:
- Scaffold app.
- Build landing page.
- Build study interface.

Phase 2:
- Build N-ATLAS adapter.
- Connect text generation only after official integration details are available.

Phase 3:
- Build ASR integration.
- Connect voice -> transcript -> N-ATLAS.

Phase 4:
- Add database.
- Add history.

Phase 5:
- Add quiz/practice.

Phase 6:
- Deploy.

Phase 7:
- Run real validation.

Phase 8:
- Collect evidence.

## Git
Never push directly to `main` during development.

Use:
```text
feature/initial-build
feature/natlas-integration
feature/voice
feature/validation
```

Merge tested work into `main`.

## Definition of Done
The MVP is complete only when:
- It is deployed.
- N-ATLAS integration is genuine.
- Voice flow works.
- At least 50 real validation interactions are documented.
- Evidence is organized.
- README explains setup.
- Demo can be completed in under 5 minutes.
