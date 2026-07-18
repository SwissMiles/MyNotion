const WEEK_MS = 7 * 86400000;

/** "YYYY-MM-DD" for the given date (defaults to today). */
export function isoDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
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

/** Whole weeks from now until the given date, never negative. */
export function weeksUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / WEEK_MS));
}

/** Day-of-week index with Monday = 0 (JS Date uses Sunday = 0). */
export function mondayDayIndex(date: Date = new Date()): number {
  return (date.getDay() + 6) % 7;
}

/** Percentage (0–100) of the way from startIso to endIso that "now" is. */
export function dateRangeProgress(startIso: string, endIso: string): number {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (end <= start) return 0;
  return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
}
