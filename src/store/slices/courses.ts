import type { AppState, Course, ID } from "../../types";

export type CoursesAction =
  | { type: "addCourse"; course: Course }
  | { type: "updateCourse"; course: Course }
  | { type: "deleteCourse"; id: ID };

export function coursesReducer(state: AppState, action: CoursesAction): AppState {
  switch (action.type) {
    case "addCourse":
      return { ...state, courses: [...state.courses, action.course] };
    case "updateCourse":
      return {
        ...state,
        courses: state.courses.map((c) => (c.id === action.course.id ? action.course : c)),
      };
    case "deleteCourse":
      return deleteCourseCascade(state, action.id);
  }
}

/** Removing a course also removes its tasks, pages, grades and flashcards. */
function deleteCourseCascade(state: AppState, courseId: ID): AppState {
  return {
    ...state,
    courses: state.courses.filter((c) => c.id !== courseId),
    tasks: state.tasks.filter((t) => t.courseId !== courseId),
    pages: state.pages.filter((p) => p.courseId !== courseId),
    grades: state.grades.filter((g) => g.courseId !== courseId),
    flashcards: state.flashcards.filter((c) => c.courseId !== courseId),
    // study time is history — keep it, just detach it from the course
    sessions: state.sessions.map((s) => (s.courseId === courseId ? { ...s, courseId: null } : s)),
  };
}
