# Recommended Project Folder Structure

```text
n-atlas-studymate/
│
├── app/
│   ├── api/
│   │   ├── study/
│   │   ├── voice/
│   │   ├── quiz/
│   │   └── history/
│   ├── study/
│   ├── learn/
│   ├── quiz/
│   ├── history/
│   └── page.js
│
├── components/
│   ├── study/
│   ├── voice/
│   ├── quiz/
│   └── ui/
│
├── lib/
│   ├── ai/
│   │   ├── natlas.js
│   │   ├── asr.js
│   │   ├── prompts.js
│   │   └── schemas.js
│   ├── db/
│   └── validation/
│
├── docs/
│   ├── 01-PRD.md
│   ├── 02-TDD.md
│   ├── 03-AI-ARCHITECTURE.md
│   ├── 04-N-ATLAS-INTEGRATION.md
│   ├── 05-VALIDATION.md
│   ├── 06-DATABASE.md
│   ├── 07-API-SPEC.md
│   ├── 08-UI-SPEC.md
│   ├── 09-README.md
│   ├── 10-MASTER-AI-CODING-PROMPT.md
│   ├── 11-DEMO-SCRIPT.md
│   ├── 12-SUBMISSION-EVIDENCE-CHECKLIST.md
│   ├── 13-BUILD-ROADMAP.md
│   ├── 14-ENV-AND-SETUP.md
│   ├── 15-NAIC-TRACK-DECISION.md
│   └── 16-PROJECT-FOLDER-STRUCTURE.md
│
├── evidence/
│   ├── 01-working-artefact/
│   ├── 02-natlas-integration/
│   ├── 03-validation/
│   ├── 04-documentation/
│   ├── 05-video/
│   ├── 06-team/
│   └── 07-endorsement/
│
├── .env.example
├── .gitignore
├── README.md
└── package.json
```

## Git Strategy

Development branches:
```text
feature/initial-build
feature/natlas-integration
feature/voice
feature/validation
```

Merge into:
```text
main
```

Only merge after the feature is working and evidence can be preserved.
