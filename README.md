# 🎓 MyNotion — a Notion alternative built for students

Everything a student needs for a semester, in one workspace: courses, notes,
assignments, exams, a weekly timetable and a grade tracker — organized around
**semesters** instead of generic pages.

All data is stored locally in your browser (`localStorage`) — no account, no
server, fully private.

![Dashboard](docs/dashboard.png)

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

Production build: `npm run build` (output in `dist/`, deployable to any static
host — GitHub Pages, Netlify, Vercel…).

## Features

### 🏠 Dashboard

One glance tells you where you stand: open tasks, days until your next exam,
your current semester average, and how far through the semester you are —
plus what's due soon and today's classes (screenshot above).

### ✅ Assignments & Exams

Tasks with a type (assignment / exam / reading / project / other), due date,
priority and course. Filter by status, type or course; overdue and due-soon
items are highlighted, everything is sorted by deadline.

![Assignments & Exams](docs/tasks.png)

### 🗓️ Weekly timetable

Auto-generated from each course's weekly meeting times (day, start/end, room).
Classes are color-coded by course, today's column is highlighted, and weekend
columns appear only if you actually have weekend classes.

![Weekly timetable](docs/timetable.png)

### 📝 Notion-style notes

A block editor with markdown shortcuts: `# ` heading, `## ` subheading,
`- ` bullet, `[] ` to-do, `> ` quote, ` ``` ` code, `---` divider. Enter
continues lists, Backspace exits them, ⌥↑/⌥↓ moves blocks. Pages can be
general or attached to a course.

![Notes editor](docs/notes.png)

### 📊 Grades (Swiss system)

Grades on the Swiss 1–6 scale (6 best, 4.0 = pass). Enter grades directly or
compute them from points using the standard formula (5 · points ⁄ max + 1).
Course grades are weighted averages rounded to quarter grades (ETH-style);
the semester average is credit-weighted. Failing grades are highlighted.

![Grades overview](docs/grades.png)

Each grade entry has a category and a percent weight; MyNotion warns you when
weights don't add up to 100%:

![Course grades](docs/course.png)

### 📚 Courses & semesters

Each course has a code, instructor, credits, a color and weekly meeting
times, and gets its own workspace with **Notes / Tasks / Grades / Info** tabs.
Semesters keep everything scoped: switch semesters from the sidebar and every
course, task, note and grade follows.

### 🌙 Dark mode & backups

Light and dark themes (toggle in the sidebar), plus JSON export / import for
backups or moving between browsers.

![Dark mode](docs/dark-mode.png)

## Tech

React 18 + TypeScript + Vite, zero other runtime dependencies.

- State lives in a single reducer (`src/store.tsx`) persisted to `localStorage`
- Types are in `src/types.ts`, grade/GPA math in `src/lib.ts`
- Views in `src/views/` (Dashboard, Tasks, Timetable, Grades, Notes, Course),
  shared pieces in `src/components/` (sidebar, block editor, task list, UI)
