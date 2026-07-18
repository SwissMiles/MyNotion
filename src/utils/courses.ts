import type { Course, CourseMeeting } from "../types";

/** A course meeting paired with the course it belongs to. */
export interface ScheduledMeeting {
  course: Course;
  meeting: CourseMeeting;
}

/** "MATH 201 · Linear Algebra", or just the name when there is no code. */
export function courseLabel(course: Course): string {
  return course.code ? `${course.code} · ${course.name}` : course.name;
}

/** The course code when set, otherwise the name — for compact tags. */
export function courseShortLabel(course: Course): string {
  return course.code || course.name;
}

export function allMeetings(courses: Course[]): ScheduledMeeting[] {
  return courses.flatMap((course) => course.meetings.map((meeting) => ({ course, meeting })));
}

export function meetingsForDay(courses: Course[], day: number): ScheduledMeeting[] {
  return allMeetings(courses)
    .filter((m) => m.meeting.day === day)
    .sort((a, b) => a.meeting.start.localeCompare(b.meeting.start));
}

/** "HH:MM" → minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}
