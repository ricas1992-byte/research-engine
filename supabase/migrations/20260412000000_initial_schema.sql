-- ============================================================
-- Musical Thinking Research Engine — Initial Schema
-- ============================================================

-- Helper: auto-update updated_at on every UPDATE
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- categories
-- ────────────────────────────────────────────────────────────
create table if not exists categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  color       text not null default '#6366f1',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists categories_user_id_idx on categories(user_id);

alter table categories enable row level security;

create policy "owner_only" on categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger categories_updated_at
  before update on categories
  for each row execute function update_updated_at();

-- ────────────────────────────────────────────────────────────
-- sub_categories
-- ────────────────────────────────────────────────────────────
create table if not exists sub_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  name        text not null,
  description text,
  "order"     integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists sub_categories_user_id_idx    on sub_categories(user_id);
create index if not exists sub_categories_category_id_idx on sub_categories(category_id);

alter table sub_categories enable row level security;

create policy "owner_only" on sub_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger sub_categories_updated_at
  before update on sub_categories
  for each row execute function update_updated_at();

-- ────────────────────────────────────────────────────────────
-- sub_questions
-- ────────────────────────────────────────────────────────────
create table if not exists sub_questions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  category_id      uuid not null references categories(id) on delete cascade,
  sub_category_id  uuid references sub_categories(id) on delete set null,
  number           text,
  text             text not null,
  description      text,
  "order"          integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists sub_questions_user_id_idx         on sub_questions(user_id);
create index if not exists sub_questions_category_id_idx     on sub_questions(category_id);
create index if not exists sub_questions_sub_category_id_idx on sub_questions(sub_category_id);

alter table sub_questions enable row level security;

create policy "owner_only" on sub_questions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger sub_questions_updated_at
  before update on sub_questions
  for each row execute function update_updated_at();

-- ────────────────────────────────────────────────────────────
-- investigations
-- raw_materials stored as JSONB (nested array, matches TS model)
-- ────────────────────────────────────────────────────────────
create table if not exists investigations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  sub_question_id  uuid not null references sub_questions(id) on delete cascade,
  title            text not null,
  content          text not null default '',
  findings         text,
  status           text not null default 'גולמי',
  raw_materials    jsonb not null default '[]'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists investigations_user_id_idx        on investigations(user_id);
create index if not exists investigations_sub_question_id_idx on investigations(sub_question_id);

alter table investigations enable row level security;

create policy "owner_only" on investigations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger investigations_updated_at
  before update on investigations
  for each row execute function update_updated_at();

-- ────────────────────────────────────────────────────────────
-- insights
-- ────────────────────────────────────────────────────────────
create table if not exists insights (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  investigation_id uuid not null references investigations(id) on delete cascade,
  text             text not null,
  status           text not null default 'גולמי',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists insights_user_id_idx         on insights(user_id);
create index if not exists insights_investigation_id_idx on insights(investigation_id);

alter table insights enable row level security;

create policy "owner_only" on insights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger insights_updated_at
  before update on insights
  for each row execute function update_updated_at();

-- ────────────────────────────────────────────────────────────
-- final_outputs
-- ────────────────────────────────────────────────────────────
create table if not exists final_outputs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  content         text not null default '',
  format          text not null default '',
  linked_insights uuid[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists final_outputs_user_id_idx on final_outputs(user_id);

alter table final_outputs enable row level security;

create policy "owner_only" on final_outputs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger final_outputs_updated_at
  before update on final_outputs
  for each row execute function update_updated_at();

-- ────────────────────────────────────────────────────────────
-- source_excerpts
-- ────────────────────────────────────────────────────────────
create table if not exists source_excerpts (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  quoted_text          text not null,
  material_id          text not null,
  material_title       text not null,
  investigation_id     text not null,
  investigation_title  text not null,
  notes                text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists source_excerpts_user_id_idx on source_excerpts(user_id);

alter table source_excerpts enable row level security;

create policy "owner_only" on source_excerpts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger source_excerpts_updated_at
  before update on source_excerpts
  for each row execute function update_updated_at();

-- ────────────────────────────────────────────────────────────
-- הרץ את הקובץ הזה פעם אחת ב-SQL Editor של Supabase.
-- אחרי הרצה מוצלחת, כל הטבלאות מוכנות לשימוש.
-- ────────────────────────────────────────────────────────────
