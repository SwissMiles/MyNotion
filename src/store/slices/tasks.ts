import type { AppState, ID, Task } from "../../types";
import { nextOccurrence } from "../../utils/tasks";

export type TasksAction =
  | { type: "addTask"; task: Task }
  | { type: "updateTask"; task: Task }
  | { type: "deleteTask"; id: ID }
  | { type: "deleteTasks"; ids: ID[] }
  | { type: "rescheduleTasks"; ids: ID[]; due: string }
  | { type: "toggleTask"; id: ID };

export function tasksReducer(state: AppState, action: TasksAction): AppState {
  switch (action.type) {
    case "addTask":
      return { ...state, tasks: [...state.tasks, action.task] };
    case "updateTask":
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.task.id ? action.task : t)),
      };
    case "deleteTask":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case "deleteTasks": {
      const ids = new Set(action.ids);
      return { ...state, tasks: state.tasks.filter((t) => !ids.has(t.id)) };
    }
    case "rescheduleTasks": {
      const ids = new Set(action.ids);
      return {
        ...state,
        tasks: state.tasks.map((t) => (ids.has(t.id) ? { ...t, due: action.due } : t)),
      };
    }
    case "toggleTask": {
      const task = state.tasks.find((t) => t.id === action.id);
      if (!task) return state;
      const tasks = state.tasks.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t));
      // completing a repeating task schedules the next occurrence — unless an
      // identical one already exists (e.g. the task was un-done and re-done)
      if (!task.done && task.repeat !== "none") {
        const semester = state.semesters.find((s) => s.id === task.semesterId);
        const next = nextOccurrence(task, semester?.endDate ?? "9999-12-31");
        const alreadySpawned =
          next !== null &&
          state.tasks.some(
            (t) =>
              t.title === next.title &&
              t.courseId === next.courseId &&
              t.due === next.due &&
              t.repeat === next.repeat,
          );
        if (next && !alreadySpawned) tasks.push(next);
      }
      return { ...state, tasks };
    }
  }
}
