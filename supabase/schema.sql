create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar text,
  grade text,
  created_at timestamptz default now()
);

create table if not exists vocabulary (
  id uuid primary key default gen_random_uuid(),
  english text not null,
  arabic text not null,
  example_sentence text,
  pronunciation text,
  unit text,
  week text,
  difficulty text default 'Easy',
  category text,
  image text,
  created_at timestamptz default now()
);

create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  word_id uuid references vocabulary(id) on delete cascade,
  mastery integer default 0,
  spelling_score integer default 0,
  translation_score integer default 0,
  last_reviewed timestamptz default now()
);

create table if not exists quiz_results (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  score integer not null,
  total_questions integer not null,
  completed_at timestamptz default now()
);

create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id) on delete cascade,
  title text not null,
  unlocked boolean default false,
  unlocked_at timestamptz
);

create index if not exists idx_vocabulary_unit on vocabulary(unit);
create index if not exists idx_progress_profile on progress(profile_id);
create index if not exists idx_quiz_profile on quiz_results(profile_id);
