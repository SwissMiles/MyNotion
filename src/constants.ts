import type { TaskKind, TaskPriority } from "./types";
import type { StaticViewKind } from "./contexts/NavigationContext";

export const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const COURSE_COLORS = [
  "#e05d5d", "#e0885d", "#d9b13b", "#6cae4f",
  "#4fae9c", "#5d8de0", "#8a6de0", "#c95dc0",
];

export function randomCourseColor(): string {
  return COURSE_COLORS[Math.floor(Math.random() * COURSE_COLORS.length)];
}

export const TASK_KIND_ICONS: Record<TaskKind, string> = {
  assignment: "📝",
  exam: "🎯",
  reading: "📖",
  project: "🛠️",
  other: "📌",
};

export const TASK_KIND_OPTIONS: { value: TaskKind; label: string }[] = [
  { value: "assignment", label: "📝 Assignment" },
  { value: "exam", label: "🎯 Exam" },
  { value: "reading", label: "📖 Reading" },
  { value: "project", label: "🛠️ Project" },
  { value: "other", label: "📌 Other" },
];

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const PAGE_ICONS = ["📄", "📝", "📚", "🧪", "💡", "🧠", "🗂️", "⭐"];

export interface MainNavItem {
  kind: StaticViewKind;
  icon: string;
  label: string;
}

/** The fixed top-level views, shared by the sidebar and Quick Find. */
export const MAIN_NAV_ITEMS: MainNavItem[] = [
  { kind: "dashboard", icon: "🏠", label: "Dashboard" },
  { kind: "tasks", icon: "✅", label: "Assignments & Exams" },
  { kind: "timetable", icon: "🗓️", label: "Timetable" },
  { kind: "grades", icon: "📊", label: "Grades" },
  { kind: "notes", icon: "📄", label: "All Notes" },
];
