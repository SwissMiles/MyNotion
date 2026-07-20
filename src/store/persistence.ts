import type { AppState, GradeEntry } from "../types";
import { uid } from "../utils/id";
import { isoDate } from "../utils/date";
import { pointsToGrade } from "../utils/grades";
import { readStoredJson, writeStoredJson } from "../utils/storage";

const STORAGE_KEY = "mynotion-state-v1";

/** Signed-in users get their own storage key so accounts don't mix. */
function storageKeyFor(userId: string | null): string {
  return userId ? `${STORAGE_KEY}:u:${userId}` : STORAGE_KEY;
}

/**
 * Version of the persisted AppState shape. Bump this and add an entry to
 * `migrations` below whenever a change to `types.ts` alters what gets stored —
 * existing users' localStorage data and old backup files are then upgraded
 * automatically on load/import.
 */
export const SCHEMA_VERSION = 4;

/** What we persist: the app state stamped with its schema version. */
export type VersionedState = AppState & { version: number };

export function serializeState(state: AppState): VersionedState {
  return { ...state, version: SCHEMA_VERSION };
}

/** v1 → v2: pre-Swiss-grading entries stored score/outOf — convert to a 1–6 grade. */
function migrateGradeV1(entry: GradeEntry): GradeEntry {
  const legacy = entry as unknown as { score?: number; outOf?: number; grade?: number };
  if (legacy.grade === undefined && legacy.outOf && legacy.outOf > 0) {
    return { ...entry, grade: pointsToGrade(legacy.score ?? 0, legacy.outOf) };
  }
  return entry;
}

/** Each step upgrades a state from version `from` to `from + 1`, in order. */
const migrations: ReadonlyArray<{ from: number; migrate: (state: AppState) => AppState }> = [
  { from: 1, migrate: (state) => ({ ...state, grades: state.grades.map(migrateGradeV1) }) },
  // v2 → v3: flashcards and study sessions were added; older snapshots lack the arrays.
  { from: 2, migrate: (state) => state },
  // v3 → v4: tasks gained a repeat field; older tasks don't repeat.
  {
    from: 3,
    migrate: (state) => ({
      ...state,
      tasks: state.tasks.map((task) => ({ ...task, repeat: task.repeat ?? "none" })),
    }),
  },
];

/**
 * Validates raw parsed JSON (from localStorage or a backup file) and runs any
 * pending migrations. Returns null when the data isn't recognizable app state.
 * Data stamped with a version newer than SCHEMA_VERSION is kept as-is rather
 * than discarded, so opening an old build never destroys newer data.
 */
export function migrateStoredState(raw: unknown): AppState | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Partial<VersionedState>;
  if (!Array.isArray(candidate.semesters)) return null;

  let version = typeof candidate.version === "number" ? candidate.version : 1;
  let state: AppState = {
    semesters: candidate.semesters,
    activeSemesterId: candidate.activeSemesterId ?? null,
    courses: Array.isArray(candidate.courses) ? candidate.courses : [],
    tasks: Array.isArray(candidate.tasks) ? candidate.tasks : [],
    pages: Array.isArray(candidate.pages) ? candidate.pages : [],
    grades: Array.isArray(candidate.grades) ? candidate.grades : [],
    flashcards: Array.isArray(candidate.flashcards) ? candidate.flashcards : [],
    sessions: Array.isArray(candidate.sessions) ? candidate.sessions : [],
  };
  for (const { from, migrate } of migrations) {
    if (version === from) {
      state = migrate(state);
      version = from + 1;
    }
  }
  return state;
}

/** A fresh state with one semester spanning last month → three months out. */
export function seedState(): AppState {
  const semesterId = uid();
  const start = new Date();
  start.setMonth(start.getMonth() - 1);
  const end = new Date();
  end.setMonth(end.getMonth() + 3);
  return {
    semesters: [{ id: semesterId, name: "My First Semester", startDate: isoDate(start), endDate: isoDate(end) }],
    activeSemesterId: semesterId,
    courses: [],
    tasks: [],
    pages: [],
    grades: [],
    flashcards: [],
    sessions: [],
  };
}

export function loadState(userId: string | null = null): AppState {
  // fall back to the pre-auth key so existing local data is adopted on first sign-in
  const raw =
    readStoredJson<unknown>(storageKeyFor(userId)) ?? readStoredJson<unknown>(STORAGE_KEY);
  return migrateStoredState(raw) ?? seedState();
}

export function saveState(state: AppState, userId: string | null = null): void {
  writeStoredJson(storageKeyFor(userId), serializeState(state));
}
