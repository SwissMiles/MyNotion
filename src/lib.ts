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
 * Swiss grading: 1.0 (worst) … 6.0 (best), 4.0 and above is a pass.
 * Weighted course average on that scale, or null when no grades entered.
 * Weights are normalized over the entered entries so a partially-graded
 * course still shows a meaningful "current standing".
 */
export function courseGrade(grades: GradeEntry[]): number | null {
  const valid = grades.filter((g) => g.weight > 0 && g.grade >= 1 && g.grade <= 6);
  if (valid.length === 0) return null;
  const totalWeight = valid.reduce((s, g) => s + g.weight, 0);
  const weighted = valid.reduce((s, g) => s + g.grade * g.weight, 0);
  return weighted / totalWeight;
}

/** Official course grade, rounded to the nearest quarter grade (ETH-style). */
export function roundToQuarter(grade: number): number {
  return Math.round(grade * 4) / 4;
}

export const PASS_GRADE = 4.0;

export function isPass(grade: number): boolean {
  return roundToQuarter(grade) >= PASS_GRADE;
}

/** Standard Swiss points-to-grade formula: 5 · points/max + 1. */
export function pointsToGrade(score: number, outOf: number): number {
  if (outOf <= 0) return 1;
  return Math.min(6, Math.max(1, 5 * (score / outOf) + 1));
}

export function fmtGrade(grade: number): string {
  // quarter grades print naturally: 4.5, 5.25 — otherwise two decimals
  const rounded = Math.round(grade * 100) / 100;
  return String(Number.isInteger(rounded * 4) ? rounded * 4 / 4 : rounded.toFixed(2));
}

/** Credit-weighted semester average (1–6) across courses that have any grades. */
export function semesterAverage(courses: Course[], grades: GradeEntry[]): number | null {
  let creditSum = 0;
  let gradeSum = 0;
  for (const c of courses) {
    const avg = courseGrade(grades.filter((g) => g.courseId === c.id));
    if (avg === null) continue;
    const credits = c.credits > 0 ? c.credits : 1;
    creditSum += credits;
    gradeSum += roundToQuarter(avg) * credits;
  }
  return creditSum > 0 ? gradeSum / creditSum : null;
}

export const TASK_KIND_ICONS: Record<string, string> = {
  assignment: "📝",
  exam: "🎯",
  reading: "📖",
  project: "🛠️",
  other: "📌",
};
