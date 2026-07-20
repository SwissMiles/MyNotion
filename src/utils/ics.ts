import type { Course, Semester, Task } from "../types";
import { courseShortLabel } from "./courses";
import { mondayDayIndex } from "./date";

/**
 * iCalendar (RFC 5545) export: course meetings become weekly recurring
 * events for the duration of the semester, and open tasks become all-day
 * events on their due date. The file imports into Google Calendar, Apple
 * Calendar, Outlook, etc. Times are written as floating local times —
 * classes happen at wall-clock time wherever the student is.
 */

/** Escape text for an ICS property value. */
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold long content lines (spec limit is 75 octets; fold early for safety). */
function fold(line: string): string {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 60) {
    // don't split a surrogate pair (e.g. an emoji) across the fold
    let at = 60;
    const code = rest.charCodeAt(at - 1);
    if (code >= 0xd800 && code <= 0xdbff) at -= 1;
    parts.push(rest.slice(0, at));
    rest = " " + rest.slice(at); // continuation lines start with a space
  }
  parts.push(rest);
  return parts.join("\r\n");
}

/** "YYYY-MM-DD" → "YYYYMMDD". */
function dateDigits(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, "");
}

/** "HH:MM" → "HHMM00". */
function timeDigits(time: string): string {
  return time.replace(":", "").padEnd(6, "0");
}

/** The first date on/after the semester start that falls on `day` (Mon = 0). */
function firstMeetingDate(semesterStartIso: string, day: number): string {
  const [year, month, dayOfMonth] = semesterStartIso.slice(0, 10).split("-").map(Number);
  const date = new Date(year, month - 1, dayOfMonth);
  const delta = (day - mondayDayIndex(date) + 7) % 7;
  date.setDate(date.getDate() + delta);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}${mm}${dd}`;
}

/** The day after an all-day event's date (ICS DTEND is exclusive). */
function nextDayDigits(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(year, month - 1, day + 1);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}${mm}${dd}`;
}

/** UTC timestamp for DTSTAMP, e.g. "20260131T120000Z". */
function utcStamp(date: Date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
}

function event(lines: string[]): string[] {
  return ["BEGIN:VEVENT", ...lines, "END:VEVENT"];
}

export function buildSemesterIcs(semester: Semester, courses: Course[], tasks: Task[]): string {
  const stamp = utcStamp();
  const until = `${dateDigits(semester.endDate)}T235959`;
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MyNotion//Semester Export//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${icsEscape(semester.name)}`,
  ];

  for (const course of courses) {
    course.meetings.forEach((meeting, index) => {
      if (!meeting.start || !meeting.end) return;
      const day = firstMeetingDate(semester.startDate, meeting.day);
      lines.push(
        ...event([
          `UID:${course.id}-${index}@mynotion`,
          `DTSTAMP:${stamp}`,
          `DTSTART:${day}T${timeDigits(meeting.start)}`,
          `DTEND:${day}T${timeDigits(meeting.end)}`,
          `RRULE:FREQ=WEEKLY;UNTIL=${until}`,
          `SUMMARY:${icsEscape(courseLabelForIcs(course))}`,
          ...(meeting.location ? [`LOCATION:${icsEscape(meeting.location)}`] : []),
        ]),
      );
    });
  }

  const courseById = new Map(courses.map((c) => [c.id, c]));
  for (const task of tasks) {
    if (task.done || !task.due) continue;
    const course = task.courseId ? courseById.get(task.courseId) : undefined;
    const suffix = course ? ` (${courseShortLabel(course)})` : "";
    lines.push(
      ...event([
        `UID:${task.id}@mynotion`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${dateDigits(task.due)}`,
        `DTEND;VALUE=DATE:${nextDayDigits(task.due)}`,
        `SUMMARY:${icsEscape(`${task.kind === "exam" ? "Exam: " : ""}${task.title}${suffix}`)}`,
        ...(task.notes ? [`DESCRIPTION:${icsEscape(task.notes)}`] : []),
      ]),
    );
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

function courseLabelForIcs(course: Course): string {
  return course.code ? `${course.code} ${course.name}` : course.name;
}

export function downloadSemesterIcs(semester: Semester, courses: Course[], tasks: Task[]): void {
  const blob = new Blob([buildSemesterIcs(semester, courses, tasks)], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${semester.name.replace(/[\\/:*?"<>|]+/g, "-")}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}
