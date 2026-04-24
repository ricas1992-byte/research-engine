-- ============================================================
-- Soft delete + missing FK indices + category_project_map
-- ------------------------------------------------------------
-- Reason: CLAUDE.md golden rule — "אל תמחק נתוני משתמש לעולם.
-- ארכוב בלבד." The original schema used hard DELETEs that
-- violate this. This migration adds `deleted_at timestamptz` to
-- every user-data table, plus explicit indices for filtered
-- queries and FKs that were missing them.
-- Also moves categoryProjectMap (previously localStorage-only)
-- into Supabase so it survives across devices.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- deleted_at columns
-- ────────────────────────────────────────────────────────────
alter table if exists categories      add column if not exists deleted_at timestamptz;
alter table if exists sub_categories  add column if not exists deleted_at timestamptz;
alter table if exists sub_questions   add column if not exists deleted_at timestamptz;
alter table if exists investigations  add column if not exists deleted_at timestamptz;
alter table if exists insights        add column if not exists deleted_at timestamptz;
alter table if exists final_outputs   add column if not exists deleted_at timestamptz;
alter table if exists source_excerpts add column if not exists deleted_at timestamptz;

-- Partial indices so "active rows only" queries stay fast
create index if not exists categories_active_idx      on categories(user_id)      where deleted_at is null;
create index if not exists sub_categories_active_idx  on sub_categories(user_id)  where deleted_at is null;
create index if not exists sub_questions_active_idx   on sub_questions(user_id)   where deleted_at is null;
create index if not exists investigations_active_idx  on investigations(user_id)  where deleted_at is null;
create index if not exists insights_active_idx        on insights(user_id)        where deleted_at is null;
create index if not exists final_outputs_active_idx   on final_outputs(user_id)   where deleted_at is null;
create index if not exists source_excerpts_active_idx on source_excerpts(user_id) where deleted_at is null;

-- Explicit indices for FK columns that weren't indexed in initial schema
create index if not exists insights_investigation_id_idx on insights(investigation_id);

-- ────────────────────────────────────────────────────────────
-- category_project_map — migrated from localStorage to Supabase
-- ────────────────────────────────────────────────────────────
create table if not exists category_project_map (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  category_id uuid not null,
  project_id  text not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, category_id)
);

create index if not exists category_project_map_user_id_idx on category_project_map(user_id);

alter table category_project_map enable row level security;

drop policy if exists "owner_only" on category_project_map;
create policy "owner_only" on category_project_map
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- audit_log — write-only trail of mutations for recovery/forensics
-- ────────────────────────────────────────────────────────────
create table if not exists audit_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity     text not null,
  entity_id  text not null,
  action     text not null,
  payload    jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_user_id_idx    on audit_log(user_id);
create index if not exists audit_log_created_at_idx on audit_log(created_at desc);

alter table audit_log enable row level security;

drop policy if exists "owner_insert_only" on audit_log;
create policy "owner_insert_only" on audit_log
  for insert with check (auth.uid() = user_id);

drop policy if exists "owner_read_only" on audit_log;
create policy "owner_read_only" on audit_log
  for select using (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────
-- הרץ את הקובץ הזה ב-SQL Editor של Supabase אחרי ה-initial schema.
-- ────────────────────────────────────────────────────────────
