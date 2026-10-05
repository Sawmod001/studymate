-- N-ATLAS StudyMate schema per 06-DATABASE.md (Supabase PostgreSQL)
create table if not exists study_sessions (
  id uuid primary key default gen_random_uuid(),
  session_key text not null unique,
  language text not null,
  academic_level text not null,
  subject text,
  created_at timestamptz default now()
);
create table if not exists lessons (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references study_sessions(id) on delete cascade,
  question text not null,
  input_type text not null check (input_type in ('voice','text')),
  transcript text null,
  response jsonb not null,
  created_at timestamptz default now()
);
create table if not exists quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references lessons(id) on delete cascade,
  score integer not null,
  total integer not null,
  answers jsonb not null,
  created_at timestamptz default now()
);
create table if not exists validation_interactions (
  id uuid primary key default gen_random_uuid(),
  language text not null,
  input_type text not null,
  subject text,
  academic_level text,
  transcription_success text,
  usefulness integer check (usefulness between 1 and 5),
  clarity text,
  user_correction boolean default false,
  feedback text null,
  created_at timestamptz default now()
);
