import type { AppState, ID, Task } from "../../types";

export type TasksAction =
  | { type: "addTask"; task: Task }
  | { type: "updateTask"; task: Task }
  | { type: "deleteTask"; id: ID }
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
    case "toggleTask":
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)),
      };
  }
}
