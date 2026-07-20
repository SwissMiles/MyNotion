import type { AppState } from "../types";
import { semestersReducer, type SemestersAction } from "./slices/semesters";
import { coursesReducer, type CoursesAction } from "./slices/courses";
import { tasksReducer, type TasksAction } from "./slices/tasks";
import { pagesReducer, type PagesAction } from "./slices/pages";
import { gradesReducer, type GradesAction } from "./slices/grades";
import { flashcardsReducer, type FlashcardsAction } from "./slices/flashcards";
import { sessionsReducer, type SessionsAction } from "./slices/sessions";

export type Action =
  | SemestersAction
  | CoursesAction
  | TasksAction
  | PagesAction
  | GradesAction
  | FlashcardsAction
  | SessionsAction
  | { type: "importState"; state: AppState };

/** Routes each action to its domain slice; slices own all update logic. */
export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "addSemester":
    case "updateSemester":
    case "deleteSemester":
    case "setActiveSemester":
      return semestersReducer(state, action);
    case "addCourse":
    case "updateCourse":
    case "deleteCourse":
      return coursesReducer(state, action);
    case "addTask":
    case "updateTask":
    case "deleteTask":
    case "toggleTask":
      return tasksReducer(state, action);
    case "addPage":
    case "updatePageMeta":
    case "setBlocks":
    case "deletePage":
      return pagesReducer(state, action);
    case "addGrade":
    case "updateGrade":
    case "deleteGrade":
      return gradesReducer(state, action);
    case "addFlashcard":
    case "updateFlashcard":
    case "deleteFlashcard":
    case "reviewFlashcard":
      return flashcardsReducer(state, action);
    case "addSession":
    case "deleteSession":
      return sessionsReducer(state, action);
    case "importState":
      return action.state;
  }
}
