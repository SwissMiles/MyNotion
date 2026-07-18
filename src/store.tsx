import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { AppState, Block, Course, GradeEntry, ID, Page, Semester, Task } from "./types";

const STORAGE_KEY = "mynotion-state-v1";

export function uid(): ID {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export const COURSE_COLORS = [
  "#e05d5d", "#e0885d", "#d9b13b", "#6cae4f",
  "#4fae9c", "#5d8de0", "#8a6de0", "#c95dc0",
];

function seedState(): AppState {
  const semId = uid();
  const today = new Date();
  const start = new Date(today);
  start.setMonth(start.getMonth() - 1);
  const end = new Date(today);
  end.setMonth(end.getMonth() + 3);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return {
    semesters: [{ id: semId, name: "My First Semester", startDate: iso(start), endDate: iso(end) }],
    activeSemesterId: semId,
    courses: [],
    tasks: [],
    pages: [],
    grades: [],
  };
}

function storageKeyFor(userId: string | null): string {
  return userId ? `${STORAGE_KEY}:u:${userId}` : STORAGE_KEY;
}

/** Apply data migrations to a state loaded from localStorage or the cloud. */
export function normalizeState(state: AppState): AppState {
  return {
    ...state,
    // migrate pre-Swiss-grading entries (score/outOf) to a 1–6 grade
    grades: state.grades.map((g) => {
      const old = g as unknown as { score?: number; outOf?: number; grade?: number };
      if (old.grade === undefined && old.outOf && old.outOf > 0) {
        return { ...g, grade: Math.min(6, Math.max(1, 5 * ((old.score ?? 0) / old.outOf) + 1)) };
      }
      return g;
    }),
  };
}

function load(userId: string | null): AppState {
  try {
    // fall back to the pre-auth key so existing local data is adopted on first sign-in
    const raw = localStorage.getItem(storageKeyFor(userId)) ?? localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw) as AppState);
  } catch {
    // corrupted storage — start fresh
  }
  return seedState();
}

export type Action =
  | { type: "addSemester"; semester: Semester }
  | { type: "updateSemester"; semester: Semester }
  | { type: "deleteSemester"; id: ID }
  | { type: "setActiveSemester"; id: ID }
  | { type: "addCourse"; course: Course }
  | { type: "updateCourse"; course: Course }
  | { type: "deleteCourse"; id: ID }
  | { type: "addTask"; task: Task }
  | { type: "updateTask"; task: Task }
  | { type: "deleteTask"; id: ID }
  | { type: "toggleTask"; id: ID }
  | { type: "addPage"; page: Page }
  | { type: "updatePageMeta"; id: ID; title?: string; icon?: string }
  | { type: "setBlocks"; pageId: ID; blocks: Block[] }
  | { type: "deletePage"; id: ID }
  | { type: "addGrade"; grade: GradeEntry }
  | { type: "updateGrade"; grade: GradeEntry }
  | { type: "deleteGrade"; id: ID }
  | { type: "importState"; state: AppState };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "addSemester":
      return { ...state, semesters: [...state.semesters, action.semester], activeSemesterId: action.semester.id };
    case "updateSemester":
      return { ...state, semesters: state.semesters.map((s) => (s.id === action.semester.id ? action.semester : s)) };
    case "deleteSemester": {
      const semesters = state.semesters.filter((s) => s.id !== action.id);
      const removedCourseIds = new Set(state.courses.filter((c) => c.semesterId === action.id).map((c) => c.id));
      return {
        ...state,
        semesters,
        activeSemesterId: state.activeSemesterId === action.id ? (semesters[0]?.id ?? null) : state.activeSemesterId,
        courses: state.courses.filter((c) => c.semesterId !== action.id),
        tasks: state.tasks.filter((t) => t.semesterId !== action.id),
        pages: state.pages.filter((p) => p.semesterId !== action.id),
        grades: state.grades.filter((g) => !removedCourseIds.has(g.courseId)),
      };
    }
    case "setActiveSemester":
      return { ...state, activeSemesterId: action.id };
    case "addCourse":
      return { ...state, courses: [...state.courses, action.course] };
    case "updateCourse":
      return { ...state, courses: state.courses.map((c) => (c.id === action.course.id ? action.course : c)) };
    case "deleteCourse":
      return {
        ...state,
        courses: state.courses.filter((c) => c.id !== action.id),
        tasks: state.tasks.filter((t) => t.courseId !== action.id),
        pages: state.pages.filter((p) => p.courseId !== action.id),
        grades: state.grades.filter((g) => g.courseId !== action.id),
      };
    case "addTask":
      return { ...state, tasks: [...state.tasks, action.task] };
    case "updateTask":
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.task.id ? action.task : t)) };
    case "deleteTask":
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.id) };
    case "toggleTask":
      return { ...state, tasks: state.tasks.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t)) };
    case "addPage":
      return { ...state, pages: [...state.pages, action.page] };
    case "updatePageMeta":
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.id
            ? { ...p, title: action.title ?? p.title, icon: action.icon ?? p.icon, updatedAt: new Date().toISOString() }
            : p,
        ),
      };
    case "setBlocks":
      return {
        ...state,
        pages: state.pages.map((p) =>
          p.id === action.pageId ? { ...p, blocks: action.blocks, updatedAt: new Date().toISOString() } : p,
        ),
      };
    case "deletePage":
      return { ...state, pages: state.pages.filter((p) => p.id !== action.id) };
    case "addGrade":
      return { ...state, grades: [...state.grades, action.grade] };
    case "updateGrade":
      return { ...state, grades: state.grades.map((g) => (g.id === action.grade.id ? action.grade : g)) };
    case "deleteGrade":
      return { ...state, grades: state.grades.filter((g) => g.id !== action.id) };
    case "importState":
      return action.state;
    default:
      return state;
  }
}

const StateCtx = createContext<AppState | null>(null);
const DispatchCtx = createContext<React.Dispatch<Action> | null>(null);

export function StoreProvider({ userId = null, children }: { userId?: string | null; children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, userId, load);

  useEffect(() => {
    localStorage.setItem(storageKeyFor(userId), JSON.stringify(state));
  }, [state, userId]);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useAppState(): AppState {
  const s = useContext(StateCtx);
  if (!s) throw new Error("useAppState outside provider");
  return s;
}

export function useDispatch(): React.Dispatch<Action> {
  const d = useContext(DispatchCtx);
  if (!d) throw new Error("useDispatch outside provider");
  return d;
}

/** Everything scoped to the currently selected semester. */
export function useActiveSemester() {
  const state = useAppState();
  const semester = state.semesters.find((s) => s.id === state.activeSemesterId) ?? null;
  return useMemo(() => {
    const courses = semester ? state.courses.filter((c) => c.semesterId === semester.id) : [];
    const courseIds = new Set(courses.map((c) => c.id));
    return {
      semester,
      courses,
      tasks: semester ? state.tasks.filter((t) => t.semesterId === semester.id) : [],
      pages: semester ? state.pages.filter((p) => p.semesterId === semester.id) : [],
      grades: state.grades.filter((g) => courseIds.has(g.courseId)),
    };
  }, [state, semester]);
}
