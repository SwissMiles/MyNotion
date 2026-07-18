# MyNotion — project notes for Claude

Vite + React SPA for students (semesters, courses, notes, tasks, grades,
timetable). State lives in localStorage; there is no backend.

## Workflow: ALWAYS merge to main and deploy

When a piece of work is finished and verified, do not stop at the feature
branch: **merge the branch into `main` and push `main`.** Pushing `main`
triggers `.github/workflows/deploy-pages.yml`, which builds and deploys the
site to GitHub Pages (served under `/MyNotion/` — `base` is set in
`vite.config.ts`). Confirm the Actions run succeeds after pushing.

Before merging into `main`:

1. `git fetch origin main` and merge `origin/main` into the working branch
   first — other branches land frequently; resolve conflicts on the feature
   branch, not on `main`.
2. `npm run build` must pass (it typechecks via `tsc -b`).
3. Verify UI changes in a real browser (see `.claude/skills/verify/SKILL.md`).

## Commands

- `npm run dev` — dev server
- `npm run build` — typecheck + production build
