import { useMemo } from "react";
import type { Page } from "../types";
import { useAppState } from "./StoreContext";

/** Everything scoped to the currently selected semester. */
export function useActiveSemester() {
  const state = useAppState();
  return useMemo(() => {
    const semester = state.semesters.find((s) => s.id === state.activeSemesterId) ?? null;
    const courses = semester ? state.courses.filter((c) => c.semesterId === semester.id) : [];
    const courseIds = new Set(courses.map((c) => c.id));
    return {
      semester,
      courses,
      tasks: semester ? state.tasks.filter((t) => t.semesterId === semester.id) : [],
      pages: semester ? state.pages.filter((p) => p.semesterId === semester.id) : [],
      grades: state.grades.filter((g) => courseIds.has(g.courseId)),
      flashcards: semester ? state.flashcards.filter((c) => c.semesterId === semester.id) : [],
      sessions: semester ? state.sessions.filter((s) => s.semesterId === semester.id) : [],
    };
  }, [state]);
}

export function usePage(pageId: string): Page | null {
  const state = useAppState();
  return state.pages.find((p) => p.id === pageId) ?? null;
}
