import type { AppState, GradeEntry, ID } from "../../types";

export type GradesAction =
  | { type: "addGrade"; grade: GradeEntry }
  | { type: "updateGrade"; grade: GradeEntry }
  | { type: "deleteGrade"; id: ID };

export function gradesReducer(state: AppState, action: GradesAction): AppState {
  switch (action.type) {
    case "addGrade":
      return { ...state, grades: [...state.grades, action.grade] };
    case "updateGrade":
      return {
        ...state,
        grades: state.grades.map((g) => (g.id === action.grade.id ? action.grade : g)),
      };
    case "deleteGrade":
      return { ...state, grades: state.grades.filter((g) => g.id !== action.id) };
  }
}
