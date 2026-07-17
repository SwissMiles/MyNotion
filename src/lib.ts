import type { Course, GradeEntry, Task } from "./types";

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function fmtDateLong(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

/** Whole days from today until the given date (negative = overdue). */
export function daysUntil(iso: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = new Date(iso);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function dueLabel(iso: string): { text: string; tone: "overdue" | "soon" | "ok" } {
  const days = daysUntil(iso);
  if (days < 0) return { text: `${-days}d overdue`, tone: "overdue" };
  if (days === 0) return { text: "Today", tone: "soon" };
  if (days === 1) return { text: "Tomorrow", tone: "soon" };
  if (days <= 7) return { text: `In ${days} days`, tone: "soon" };
  return { text: fmtDate(iso), tone: "ok" };
}

export function sortByDue(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.due.localeCompare(b.due));
}

/**
 * Weighted course grade in percent, or null when no grades entered.
 * Each entry contributes (score/outOf) at its weight; weights are normalized
 * over the entered entries so a partially-graded course still shows a
 * meaningful "current standing".
 */
export function courseGrade(grades: GradeEntry[]): number | null {
  const valid = grades.filter((g) => g.outOf > 0 && g.weight > 0);
  if (valid.length === 0) return null;
  const totalWeight = valid.reduce((s, g) => s + g.weight, 0);
  const weighted = valid.reduce((s, g) => s + (g.score / g.outOf) * g.weight, 0);
  return (weighted / totalWeight) * 100;
}

/** US-style 4.0 scale from a percentage. */
export function percentToGpa(pct: number): number {
  if (pct >= 93) return 4.0;
  if (pct >= 90) return 3.7;
  if (pct >= 87) return 3.3;
  if (pct >= 83) return 3.0;
  if (pct >= 80) return 2.7;
  if (pct >= 77) return 2.3;
  if (pct >= 73) return 2.0;
  if (pct >= 70) return 1.7;
  if (pct >= 67) return 1.3;
  if (pct >= 63) return 1.0;
  if (pct >= 60) return 0.7;
  return 0.0;
}

export function letterGrade(pct: number): string {
  if (pct >= 93) return "A";
  if (pct >= 90) return "A-";
  if (pct >= 87) return "B+";
  if (pct >= 83) return "B";
  if (pct >= 80) return "B-";
  if (pct >= 77) return "C+";
  if (pct >= 73) return "C";
  if (pct >= 70) return "C-";
  if (pct >= 67) return "D+";
  if (pct >= 63) return "D";
  if (pct >= 60) return "D-";
  return "F";
}

/** Credit-weighted GPA across courses that have any grades. */
export function semesterGpa(courses: Course[], grades: GradeEntry[]): number | null {
  let creditSum = 0;
  let pointSum = 0;
  for (const c of courses) {
    const pct = courseGrade(grades.filter((g) => g.courseId === c.id));
    if (pct === null) continue;
    const credits = c.credits > 0 ? c.credits : 1;
    creditSum += credits;
    pointSum += percentToGpa(pct) * credits;
  }
  return creditSum > 0 ? pointSum / creditSum : null;
}

export const TASK_KIND_ICONS: Record<string, string> = {
  assignment: "📝",
  exam: "🎯",
  reading: "📖",
  project: "🛠️",
  other: "📌",
};
