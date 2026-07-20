export type ID = string;

export interface Semester {
  id: ID;
  name: string; // e.g. "Fall 2026"
  startDate: string; // ISO date
  endDate: string; // ISO date
}

export interface CourseMeeting {
  day: number; // 0 = Monday … 6 = Sunday
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  location: string;
}

export interface Course {
  id: ID;
  semesterId: ID;
  name: string;
  code: string; // e.g. "CS 101"
  instructor: string;
  credits: number;
  color: string;
  meetings: CourseMeeting[];
}

export type TaskKind = "assignment" | "exam" | "reading" | "project" | "other";
export type TaskPriority = "low" | "medium" | "high";
export type TaskRepeat = "none" | "weekly" | "biweekly" | "monthly";

export interface Task {
  id: ID;
  courseId: ID | null; // null = personal / not tied to a course
  semesterId: ID;
  title: string;
  kind: TaskKind;
  due: string; // ISO datetime (date at least)
  priority: TaskPriority;
  done: boolean;
  notes: string;
  // completing a repeating task schedules the next occurrence automatically
  repeat: TaskRepeat;
}

export type BlockType =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "todo"
  | "bullet"
  | "numbered"
  | "quote"
  | "callout"
  | "divider"
  | "code"
  | "image";

export interface Block {
  id: ID;
  type: BlockType;
  text: string; // for image blocks this is the caption
  checked?: boolean; // for todo blocks
  indent?: number; // 0 (default) … 4, set with Tab / Shift-Tab
  url?: string; // for image blocks: data URI or external URL
}

export interface Page {
  id: ID;
  courseId: ID | null; // null = general page for the semester
  semesterId: ID;
  title: string;
  icon: string; // emoji
  blocks: Block[];
  updatedAt: string;
}

export interface GradeEntry {
  id: ID;
  courseId: ID;
  name: string; // e.g. "Midterm 1"
  category: string; // e.g. "Exams"
  grade: number; // Swiss grade, 1.0 (worst) to 6.0 (best); 4.0 is a pass
  weight: number; // percent weight of final grade
}

export type ReviewRating = "again" | "hard" | "good" | "easy";

export interface Flashcard {
  id: ID;
  courseId: ID | null; // null = general deck for the semester
  semesterId: ID;
  front: string;
  back: string;
  // Spaced-repetition state (SM-2 style)
  ease: number; // ease factor, starts at 2.5
  intervalDays: number; // current interval; 0 = new / relearning
  reps: number; // consecutive successful reviews
  due: string; // ISO date the card is next due
}

export interface StudySession {
  id: ID;
  courseId: ID | null; // null = general studying
  semesterId: ID;
  startedAt: string; // ISO datetime
  minutes: number;
}

export interface AppState {
  semesters: Semester[];
  activeSemesterId: ID | null;
  courses: Course[];
  tasks: Task[];
  pages: Page[];
  grades: GradeEntry[];
  flashcards: Flashcard[];
  sessions: StudySession[];
}
