# Environment and Setup

## Required
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NATLAS_API_BASE_URL=
NATLAS_API_KEY=
NATLAS_LLM_MODEL=NCAIR1/N-ATLaS
```

## ASR Configuration
Use the official N-ATLAS/NCAIR service configuration supplied through the challenge.

Do not hard-code:
- URLs
- tokens
- private endpoints
- credentials

## Local Development

```bash
npm install
npm run dev
```

## Production
Configure the same environment variables in the hosting platform.

## Secret Handling
Never:
- commit `.env.local`
- put API keys in client components
- paste keys into screenshots
- expose service credentials in public GitHub issues

Add:

```text
.env*
!.env.example
```

to `.gitignore`.

## Health Check
Create an internal server-side health check that reports:
- configuration present
- provider reachable
- model configured

It must never return secrets.
