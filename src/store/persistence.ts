import type { AppState, GradeEntry } from "../types";
import { uid } from "../utils/id";
import { isoDate } from "../utils/date";
import { pointsToGrade } from "../utils/grades";
import { readStoredJson, writeStoredJson } from "../utils/storage";

const STORAGE_KEY = "mynotion-state-v1";

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

/** Fills in collections added after a state was saved (older localStorage
 *  snapshots and backup files won't have them). */
export function withStateDefaults(stored: AppState): AppState {
  return {
    ...stored,
    grades: Array.isArray(stored.grades) ? stored.grades.map(migrateGrade) : [],
    flashcards: Array.isArray(stored.flashcards) ? stored.flashcards : [],
    sessions: Array.isArray(stored.sessions) ? stored.sessions : [],
  };
}

/** Pre-Swiss-grading entries stored score/outOf — convert them to a 1–6 grade. */
function migrateGrade(entry: GradeEntry): GradeEntry {
  const legacy = entry as unknown as { score?: number; outOf?: number; grade?: number };
  if (legacy.grade === undefined && legacy.outOf && legacy.outOf > 0) {
    return { ...entry, grade: pointsToGrade(legacy.score ?? 0, legacy.outOf) };
  }
  return entry;
}

export function loadState(): AppState {
  const stored = readStoredJson<AppState>(STORAGE_KEY);
  if (!stored || !Array.isArray(stored.semesters)) return seedState();
  return withStateDefaults(stored);
}

export function saveState(state: AppState): void {
  writeStoredJson(STORAGE_KEY, state);
}
