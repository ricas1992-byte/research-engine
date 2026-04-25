-- ============================================================
-- Add `default auth.uid()` to user_id on all user-data tables
-- ------------------------------------------------------------
-- Reason: API code (src/lib/api/*.ts) does not set user_id on
-- INSERT — it relies on the DB defaulting to auth.uid() so that
-- the RLS policy `auth.uid() = user_id` passes. The original
-- 20260412 migration created these columns as NOT NULL without
-- a default, so any insert from the client failed RLS:
--   ERROR: new row violates row-level security policy for
--   table "categories"
-- The 2 newer tables (category_project_map, audit_log) already
-- got `default auth.uid()` in PR #1; this migration extends the
-- pattern to the original 7 tables.
-- ============================================================

alter table if exists categories      alter column user_id set default auth.uid();
alter table if exists sub_categories  alter column user_id set default auth.uid();
alter table if exists sub_questions   alter column user_id set default auth.uid();
alter table if exists investigations  alter column user_id set default auth.uid();
alter table if exists insights        alter column user_id set default auth.uid();
alter table if exists final_outputs   alter column user_id set default auth.uid();
alter table if exists source_excerpts alter column user_id set default auth.uid();

-- ────────────────────────────────────────────────────────────
-- הרץ ב-SQL Editor של Supabase. בטוח להריץ פעמים — `set default`
-- אידמפוטנטי ולא נוגע בנתונים קיימים.
-- ────────────────────────────────────────────────────────────
