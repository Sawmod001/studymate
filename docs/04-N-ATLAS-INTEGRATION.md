# N-ATLAS Integration Specification

## 1. Critical Compliance Rule

The challenge requires genuine N-ATLAS integration.

Do not use:
- OpenAI as the core generator.
- Gemini as the core generator.
- Claude as the core generator.
- Generic hosted Whisper as a substitute for required N-ATLAS ASR.

External services may only be used where they do not replace the required N-ATLAS capability and where challenge rules permit them.

## 2. Official Model Components

Expected NCAIR model components include:
- `NCAIR1/N-ATLaS`
- `NCAIR1/Yoruba-ASR`
- `NCAIR1/Hausa-ASR`
- `NCAIR1/Igbo-ASR`
- `NCAIR1/NigerianAccentedEnglish`

## 3. Hosted Service Verification

Before final implementation, verify from official NCAIR/NAIC onboarding:
- Base URL.
- Authentication method.
- LLM endpoint.
- ASR endpoint.
- Supported request format.
- Audio formats.
- Maximum duration/file size.
- Rate limits.
- Response schema.
- Error schema.
- Whether local model inference is accepted as equivalent to the official ASR service.

Do not invent these values.

## 4. Environment Variables

Use placeholders until official credentials are issued:

```env
NATLAS_API_BASE_URL=
NATLAS_API_KEY=
NATLAS_LLM_MODEL=NCAIR1/N-ATLaS
NATLAS_ASR_YORUBA_MODEL=NCAIR1/Yoruba-ASR
NATLAS_ASR_HAUSA_MODEL=NCAIR1/Hausa-ASR
NATLAS_ASR_IGBO_MODEL=NCAIR1/Igbo-ASR
NATLAS_ASR_ENGLISH_MODEL=NCAIR1/NigerianAccentedEnglish
```

## 5. Adapter Interface

```js
export async function generateStudyResponse({
  question,
  language,
  level,
  subject,
  mode
}) {
  // Call official N-ATLAS integration here.
}

export async function transcribeWithNatlas({
  audio,
  language
}) {
  // Call official N-ATLAS ASR service here.
}
```

## 6. Integration Evidence

Capture:
1. Configuration showing N-ATLAS model identifier.
2. Request/response example with secrets removed.
3. Application UI showing N-ATLAS-powered response.
4. Voice recording -> transcript -> answer demonstration.
5. Logs proving requests reached the N-ATLAS integration.
6. Repository code for the adapter.
7. README setup instructions.

## 7. Important
The repository must make it possible for an evaluator to understand exactly where N-ATLAS is used.

Never write:
> "Powered by N-ATLAS"

without showing the technical integration behind the claim.
