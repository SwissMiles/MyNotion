import type { Task, TaskKind } from "../../types";
import { daysUntil } from "../../utils/date";
import { sortByDue } from "../../utils/tasks";
import type { DueTone } from "../../utils/tasks";

export type StatusFilter = "open" | "done" | "all";

export interface TaskFilters {
  status: StatusFilter;
  kind: TaskKind | "all";
  /** Course id, "" for personal tasks, or "all". */
  courseId: string;
}

export const DEFAULT_TASK_FILTERS: TaskFilters = { status: "open", kind: "all", courseId: "all" };

export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  return tasks.filter((task) => {
    if (filters.status === "open" && task.done) return false;
    if (filters.status === "done" && !task.done) return false;
    if (filters.kind !== "all" && task.kind !== filters.kind) return false;
    if (filters.courseId !== "all" && (task.courseId ?? "") !== filters.courseId) return false;
    return true;
  });
}

export interface TaskGroup {
  label: string;
  tone?: DueTone;
  tasks: Task[];
}

/** Buckets open tasks by urgency; empty groups are dropped. */
export function groupOpenTasks(tasks: Task[]): TaskGroup[] {
  const sorted = sortByDue(tasks);
  const groups: TaskGroup[] = [
    { label: "Overdue", tone: "overdue", tasks: [] },
    { label: "Today", tone: "soon", tasks: [] },
    { label: "This week", tasks: [] },
    { label: "Later", tasks: [] },
  ];
  for (const task of sorted) {
    const days = daysUntil(task.due);
    if (days < 0) groups[0].tasks.push(task);
    else if (days === 0) groups[1].tasks.push(task);
    else if (days <= 7) groups[2].tasks.push(task);
    else groups[3].tasks.push(task);
  }
  return groups.filter((group) => group.tasks.length > 0);
}
