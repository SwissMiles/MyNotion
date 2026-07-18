# 🎓 MyNotion — a Notion alternative built for students

Everything a student needs for a semester, in one workspace: courses, notes,
assignments, exams, a weekly timetable and a grade tracker — organized around
**semesters** instead of generic pages.

![screenshot](docs/screenshot.png)

## Features

- **Semesters** — switch between semesters; every course, task, note and grade
  is scoped to one. Dashboard shows how far through the semester you are.
- **Courses** — code, instructor, credits, a color, and weekly meeting times
  (day / start / end / room).
- **Dashboard** — open tasks, days until your next exam, current GPA, semester
  progress, what's due soon and today's classes.
- **Assignments & Exams** — tasks with type (assignment / exam / reading /
  project), due date, priority and course. Filter by status, type or course;
  overdue and due-soon items are highlighted.
- **Weekly timetable** — auto-generated from course meeting times, color-coded,
  weekend columns appear only if you have weekend classes.
- **Notion-style notes** — block editor with markdown shortcuts:
  `# ` heading, `## ` subheading, `- ` bullet, `[] ` to-do, `> ` quote,
  ` ``` ` code, `---` divider. Enter continues lists, Backspace exits them,
  ⌥↑/⌥↓ moves blocks. Pages can be general or attached to a course.
- **Grades (Swiss system)** — grades on the Swiss 1–6 scale (6 best,
  4.0 = pass). Enter grades directly or from points using the standard formula
  (5 · points ⁄ max + 1). Course grades are weighted averages rounded to
  quarter grades (ETH-style); the semester average is credit-weighted. Failing
  grades are highlighted.
- **Light & dark mode**, and **JSON export / import** for backups.
- **Cloud sync & login (optional)** — sign in with Google or GitHub (no
  passwords) via Clerk, and your data is stored in a free hosted Postgres
  database (Supabase) so it survives cleared browsers and follows you across
  devices. See [docs/CLOUD_SETUP.md](docs/CLOUD_SETUP.md).

Without cloud configuration, all data is stored locally in your browser
(`localStorage`) — no account, no server, fully private.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

To enable login + cloud storage, follow [docs/CLOUD_SETUP.md](docs/CLOUD_SETUP.md)
(about 15 minutes, both services are free).

Production build: `npm run build` (output in `dist/`, deployable to any static
host — GitHub Pages, Netlify, Vercel…).

## Tech

React 18 + TypeScript + Vite. State lives in a single reducer
(`src/store.tsx`) persisted to `localStorage`; types are in `src/types.ts`,
grade/GPA math in `src/lib.ts`. Optional cloud layer: Clerk for auth
(`src/auth.tsx`), Supabase for storage with row-level security
(`src/cloud.tsx`, `supabase/schema.sql`).
