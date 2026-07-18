import type { AppState, ID, Semester } from "../../types";

export type SemestersAction =
  | { type: "addSemester"; semester: Semester }
  | { type: "updateSemester"; semester: Semester }
  | { type: "deleteSemester"; id: ID }
  | { type: "setActiveSemester"; id: ID };

export function semestersReducer(state: AppState, action: SemestersAction): AppState {
  switch (action.type) {
    case "addSemester":
      return {
        ...state,
        semesters: [...state.semesters, action.semester],
        activeSemesterId: action.semester.id,
      };
    case "updateSemester":
      return {
        ...state,
        semesters: state.semesters.map((s) => (s.id === action.semester.id ? action.semester : s)),
      };
    case "deleteSemester":
      return deleteSemesterCascade(state, action.id);
    case "setActiveSemester":
      return { ...state, activeSemesterId: action.id };
  }
}

/** Removing a semester also removes its courses, tasks, pages and grades. */
function deleteSemesterCascade(state: AppState, semesterId: ID): AppState {
  const semesters = state.semesters.filter((s) => s.id !== semesterId);
  const removedCourseIds = new Set(
    state.courses.filter((c) => c.semesterId === semesterId).map((c) => c.id),
  );
  return {
    ...state,
    semesters,
    activeSemesterId:
      state.activeSemesterId === semesterId ? (semesters[0]?.id ?? null) : state.activeSemesterId,
    courses: state.courses.filter((c) => c.semesterId !== semesterId),
    tasks: state.tasks.filter((t) => t.semesterId !== semesterId),
    pages: state.pages.filter((p) => p.semesterId !== semesterId),
    grades: state.grades.filter((g) => !removedCourseIds.has(g.courseId)),
  };
}
