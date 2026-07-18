import type { Task } from "../types";
import { daysUntil, fmtDate } from "./date";

export type DueTone = "overdue" | "soon" | "ok";

export interface DueInfo {
  text: string;
  tone: DueTone;
}

export function dueLabel(iso: string): DueInfo {
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

export function openTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.done);
}
