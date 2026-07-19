import type { Block, Course, GradeEntry, Task } from "./types";

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** "YYYY-MM-DD" using the local calendar date (toISOString converts via UTC,
 *  which can land on the neighbouring day depending on the timezone). */
export function isoDateLocal(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Day-of-week index with Monday = 0 (JS Date uses Sunday = 0). */
export function mondayDayIndex(date: Date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

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

/**
 * Average grade needed on the not-yet-graded weight (assuming weights total
 * 100%) so the final course average reaches `target`. Null when everything
 * is already graded — there's nothing left to influence.
 */
export function requiredGrade(grades: GradeEntry[], target: number): { remaining: number; needed: number } | null {
  const valid = grades.filter((g) => g.weight > 0 && g.grade >= 1 && g.grade <= 6);
  const usedWeight = valid.reduce((s, g) => s + g.weight, 0);
  const remaining = 100 - usedWeight;
  if (remaining <= 0) return null;
  const earned = valid.reduce((s, g) => s + g.grade * g.weight, 0);
  return { remaining, needed: (target * 100 - earned) / remaining };
}

/** Serialize a note page to plain Markdown for export. */
export function blocksToMarkdown(title: string, blocks: Block[]): string {
  const isList = (b: Block) => b.type === "bullet" || b.type === "todo" || b.type === "numbered";
  // drop trailing empty blocks so the file doesn't end in blank paragraphs
  while (blocks.length > 0 && blocks[blocks.length - 1].type === "text" && blocks[blocks.length - 1].text === "") {
    blocks = blocks.slice(0, -1);
  }
  let body = "";
  let numbered = 0;
  blocks.forEach((b, i) => {
    const indent = "  ".repeat(b.indent ?? 0);
    numbered = b.type === "numbered" ? numbered + 1 : 0;
    let line: string;
    switch (b.type) {
      case "h1": line = `# ${b.text}`; break;
      case "h2": line = `## ${b.text}`; break;
      case "h3": line = `### ${b.text}`; break;
      case "bullet": line = `${indent}- ${b.text}`; break;
      case "numbered": line = `${indent}${numbered}. ${b.text}`; break;
      case "todo": line = `${indent}- [${b.checked ? "x" : " "}] ${b.text}`; break;
      case "quote": line = `> ${b.text}`; break;
      case "callout": line = `> 💡 ${b.text}`; break;
      case "code": line = "```\n" + b.text + "\n```"; break;
      case "divider": line = "---"; break;
      case "image": line = `![${b.text}](${b.url ?? ""})`; break;
      default: line = b.text;
    }
    // adjacent list items stay in one list; everything else gets a blank line
    const sep = i === 0 ? "" : isList(b) && isList(blocks[i - 1]) ? "\n" : "\n\n";
    body += sep + line;
  });
  return `# ${title || "Untitled"}\n\n${body}\n`;
}

export const TASK_KIND_ICONS: Record<string, string> = {
  assignment: "📝",
  exam: "🎯",
  reading: "📖",
  project: "🛠️",
  other: "📌",
};
