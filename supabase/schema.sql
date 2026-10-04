create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references auth.users(id) on delete cascade,
  name text not null,
  avatar text,
  grade text,
  created_at timestamptz not null default now()
);

alter table profiles
  add column if not exists parent_id uuid references auth.users(id) on delete cascade;

alter table profiles
  alter column parent_id set default auth.uid();

create table if not exists vocabulary (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  english text not null,
  arabic text not null,
  example_sentence text,
  pronunciation text,
  unit text,
  week text,
  difficulty text not null default 'Easy',
  category text,
  image text,
  created_at timestamptz not null default now()
);

alter table vocabulary
  add column if not exists owner_id uuid references auth.users(id) on delete set null;

alter table vocabulary
  alter column owner_id set default auth.uid();

create table if not exists progress (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  word_id uuid not null references vocabulary(id) on delete cascade,
  mastery integer not null default 0,
  spelling_score integer not null default 0,
  translation_score integer not null default 0,
  last_reviewed timestamptz not null default now()
);

create table if not exists quiz_results (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  score integer not null,
  total_questions integer not null,
  completed_at timestamptz not null default now()
);

create table if not exists achievements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  unlocked boolean not null default false,
  unlocked_at timestamptz
);

create index if not exists idx_vocabulary_unit on vocabulary(unit);
create index if not exists idx_vocabulary_owner on vocabulary(owner_id);
create index if not exists idx_profiles_parent on profiles(parent_id);
create index if not exists idx_progress_profile on progress(profile_id);
create unique index if not exists idx_profiles_one_child_per_parent on profiles(parent_id) where parent_id is not null;
create unique index if not exists idx_progress_one_row_per_word on progress(profile_id, word_id);
create index if not exists idx_quiz_profile on quiz_results(profile_id);
create index if not exists idx_achievements_profile on achievements(profile_id);

alter table profiles enable row level security;
alter table vocabulary enable row level security;
alter table progress enable row level security;
alter table quiz_results enable row level security;
alter table achievements enable row level security;

revoke all on table profiles, vocabulary, progress, quiz_results, achievements from anon;
revoke all on table profiles, vocabulary, progress, quiz_results, achievements from authenticated;

grant select (id, english, arabic, example_sentence, pronunciation, unit, week, difficulty, category, image, created_at)
  on table vocabulary to anon;
grant insert (english, arabic) on table vocabulary to anon;
grant select, insert, update, delete on table vocabulary to authenticated;
grant select, insert, update, delete on table profiles, progress, quiz_results, achievements to authenticated;

drop policy if exists "Anyone can read vocabulary" on vocabulary;
drop policy if exists "Parents can add owned vocabulary" on vocabulary;
drop policy if exists "Parents can update owned vocabulary" on vocabulary;
drop policy if exists "Parents can delete owned vocabulary" on vocabulary;
drop policy if exists "Children can add words without signing in" on vocabulary;

create policy "Anyone can read vocabulary"
  on vocabulary for select
  to anon, authenticated
  using (true);

create policy "Parents can add owned vocabulary"
  on vocabulary for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy "Parents can update owned vocabulary"
  on vocabulary for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "Parents can delete owned vocabulary"
  on vocabulary for delete
  to authenticated
  using (owner_id = (select auth.uid()));

create policy "Children can add words without signing in"
  on vocabulary for insert
  to anon
  with check (
    owner_id is null
    and char_length(btrim(english)) between 1 and 100
    and char_length(btrim(arabic)) between 1 and 100
  );

drop policy if exists "Parents can manage own profiles" on profiles;
create policy "Parents can manage own profiles"
  on profiles for all
  to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));

drop policy if exists "Parents can manage own child progress" on progress;
create policy "Parents can manage own child progress"
  on progress for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = progress.profile_id
        and profiles.parent_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = progress.profile_id
        and profiles.parent_id = (select auth.uid())
    )
  );

drop policy if exists "Parents can manage own quiz results" on quiz_results;
create policy "Parents can manage own quiz results"
  on quiz_results for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = quiz_results.profile_id
        and profiles.parent_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = quiz_results.profile_id
        and profiles.parent_id = (select auth.uid())
    )
  );

drop policy if exists "Parents can manage own achievements" on achievements;
create policy "Parents can manage own achievements"
  on achievements for all
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = achievements.profile_id
        and profiles.parent_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.id = achievements.profile_id
        and profiles.parent_id = (select auth.uid())
    )
  );
