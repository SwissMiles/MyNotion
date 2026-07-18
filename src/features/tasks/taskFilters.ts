import type { Task, TaskKind } from "../../types";

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
