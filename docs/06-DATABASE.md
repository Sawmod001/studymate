# Database Design

## 1. Database
Supabase PostgreSQL.

## 2. Tables

### study_sessions
```text
id UUID PK
session_key TEXT
language TEXT
academic_level TEXT
subject TEXT
created_at TIMESTAMPTZ
```

### lessons
```text
id UUID PK
session_id UUID FK
question TEXT
input_type TEXT
transcript TEXT NULL
response JSONB
created_at TIMESTAMPTZ
```

### quiz_attempts
```text
id UUID PK
lesson_id UUID FK
score INTEGER
total INTEGER
answers JSONB
created_at TIMESTAMPTZ
```

### validation_interactions
```text
id UUID PK
language TEXT
input_type TEXT
subject TEXT
academic_level TEXT
transcription_success TEXT
usefulness INTEGER
clarity TEXT
user_correction BOOLEAN
feedback TEXT NULL
created_at TIMESTAMPTZ
```

## 3. Privacy
- Prefer anonymous session IDs.
- Do not require email for MVP.
- Do not store raw voice by default.
- Do not store sensitive student information.
- Use database policies where applicable.

## 4. Retention
Validation records should be retained only as long as needed for challenge evidence and product improvement.
