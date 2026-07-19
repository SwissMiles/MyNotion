import type { StudySession } from "./types";
import { isoDateLocal } from "./lib";

export function totalMinutes(sessions: StudySession[]): number {
  return sessions.reduce((sum, s) => sum + s.minutes, 0);
}

export function sessionsOnDay(sessions: StudySession[], dayIso: string): StudySession[] {
  return sessions.filter((s) => isoDateLocal(new Date(s.startedAt)) === dayIso);
}

/** Sessions started within the last `days` days (including today). */
export function sessionsInLastDays(sessions: StudySession[], days: number): StudySession[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  cutoff.setHours(0, 0, 0, 0);
  return sessions.filter((s) => new Date(s.startedAt).getTime() >= cutoff.getTime());
}

/** Minutes per course id ("" = no course), descending. */
export function minutesByCourse(sessions: StudySession[]): { courseId: string; minutes: number }[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const key = s.courseId ?? "";
    map.set(key, (map.get(key) ?? 0) + s.minutes);
  }
  return [...map.entries()]
    .map(([courseId, minutes]) => ({ courseId, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}

/** 95 → "1h 35m", 45 → "45m" */
export function fmtMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}
