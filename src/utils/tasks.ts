import type { Task, TaskRepeat } from "../types";
import { daysUntil, fmtDate, isoDate, isoDatePlusDays } from "./date";
import { uid } from "./id";

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

/** One day later than the due date — but never earlier than tomorrow, so
 *  snoozing an overdue task always parks it on tomorrow. */
export function snoozedDue(dueIso: string): string {
  const tomorrow = isoDatePlusDays(1);
  const day = dueIso.slice(0, 10);
  if (day < tomorrow) return tomorrow;
  const [year, month, date] = day.split("-").map(Number);
  return isoDatePlusDays(1, new Date(year, month - 1, date));
}

export function sortByDue(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.due.localeCompare(b.due));
}

export function openTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => !t.done);
}

/** The due date one repeat interval after `dueIso`, or null for non-repeating. */
export function nextDueDate(dueIso: string, repeat: TaskRepeat): string | null {
  const [year, month, day] = dueIso.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  switch (repeat) {
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "biweekly":
      date.setDate(date.getDate() + 14);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    default:
      return null;
  }
  return isoDate(date);
}

/**
 * The follow-up task spawned when a repeating task is completed: same task,
 * new id, due one interval later. Null when the task doesn't repeat or the
 * next occurrence would fall after the semester ends.
 */
export function nextOccurrence(task: Task, semesterEndIso: string): Task | null {
  const due = nextDueDate(task.due, task.repeat);
  if (!due || due > semesterEndIso) return null;
  return { ...task, id: uid(), due, done: false };
}
