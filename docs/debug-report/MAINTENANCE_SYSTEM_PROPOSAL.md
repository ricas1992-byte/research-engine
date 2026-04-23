# Maintenance System Proposal — Research Engine

> Last updated: 2026-04-19
> Status: Approved, pending phased implementation.

---

## Overview

Seven maintenance components, deployed in three phases. No component is
implemented until its phase is explicitly approved and the login flow is
confirmed working.

---

## Phase 1 — Implement immediately after login works

**Components: 1 (Build + Lint) and 3 (Env validation)**

### Component 1: Build + Lint on-save + pre-commit

- ESLint runs on every file save (VS Code settings).
- `tsc --noEmit` runs as a pre-commit hook (via **husky**). Commit is blocked
  if type errors are found.
- ESLint also runs as a pre-commit hook (via husky).

**Rationale:** The current bug was caused by a broken environment that was
never caught before it reached the working directory. `tsc --noEmit` catches
the same type errors that matter, in seconds rather than the 20–60 s a full
`npm run build` takes. The full build is reserved for CI. ESLint stays
pre-commit to catch style and correctness issues early.

**Why husky:** Husky is the ecosystem standard for Git hooks in Node projects,
has broad community support, and integrates cleanly with the existing
`package.json` scripts setup.

**Notification channel (Phase 1):** VS Code Problems Panel + Terminal output.

---

### Component 3: Env validation (predev hook + pre-commit)

- A small Node script checks that `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` are present and non-empty in `.env.local`
  before `npm run dev` starts (via `predev` in `package.json`).
- The same check runs as a pre-commit hook (exits 1 if env is missing,
  blocks commit with a clear message).

**Rationale:** The current bug was caused partly by a missing `.env.local`.
This component makes it impossible to start the dev server or commit code
without the required env vars in place.

**Notification channel (Phase 1):** Terminal output (clear error message with
instructions to create `.env.local`).

---

## Phase 2 — Implement after 1–2 weeks of stable work

**Components: 2 (npm audit + outdated) and 5 (RTL / Hebrew check)**

### Component 2: npm audit + outdated (weekly)

- A script runs `npm audit --audit-level=high` and `npm outdated` and
  writes a summary to `docs/health/deps-YYYY-MM-DD.txt`.
- Triggered manually or via a weekly reminder (no automation until Phase 3).

**Rationale:** Dependency health is important for long-term stability but not
urgent. Running this before the project settles generates noise without value.
One to two weeks of stable work establishes a baseline.

**Notification channel (Phase 2):** VS Code Status Bar badge (count of
high-severity vulnerabilities).

---

### Component 5: RTL / Hebrew check (pre-commit, warning only)

- A pre-commit script scans staged `.tsx` / `.ts` files for hardcoded
  `direction: ltr` or `text-align: left` without a corresponding RTL override.
- Exits 0 (warning only, never blocks commit).

**Rationale:** Hebrew UI quality degrades silently. A non-blocking warning
keeps RTL hygiene visible without slowing down the workflow.

**Notification channel (Phase 2):** VS Code Status Bar badge.

---

## Phase 3 — Implement when the project grows

**Components: 4 (Bundle size monitoring) and 6 (Supabase schema validation)**

### Component 4: Bundle size monitoring

- `rollup-plugin-visualizer` added to `vite.config.ts`.
- A threshold (e.g., 500 KB gzipped) is set; CI fails if exceeded.
- A `docs/health/bundle-YYYY-MM-DD.html` snapshot is saved on each build.

**Rationale:** Bundle size only becomes meaningful once the feature set is
stable. Monitoring it earlier produces thresholds that will need constant
adjustment and create false urgency.

**Notification channel (Phase 3):** VS Code Notification toast on build
completion if threshold is exceeded.

---

### Component 6: Supabase schema validation

- A script queries `information_schema` and compares the live schema against
  a local snapshot (`docs/schema-snapshot.json`).
- Runs on `predev` and warns if the live schema diverges from the snapshot.

**Rationale:** Schema drift is a problem at scale, when multiple developers
or migrations are active. At the current project size, manual migration review
is sufficient.

**Notification channel (Phase 3):** VS Code Notification toast.

---

## Component 7: Notification channels — rollout across phases

| Phase | Channel added |
|-------|--------------|
| 1 | VS Code Problems Panel + Terminal |
| 2 | VS Code Status Bar badge |
| 3 | VS Code Notification toasts |

---

## Constraints

- Nothing in this document is implemented until the login flow is confirmed
  working end-to-end.
- Each phase requires explicit approval before implementation begins.
- `src/` is not modified as part of any maintenance component.
- No changes to `package.json`, `vite.config.ts`, or `tsconfig.json` until
  Phase 1 is approved.
