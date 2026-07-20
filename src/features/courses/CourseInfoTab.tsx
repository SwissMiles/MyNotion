import React from "react";
import type { Course } from "../../types";
import { DAY_NAMES } from "../../constants";

export function CourseInfoTab({ course }: { course: Course }) {
  return (
    <div className="card">
      <table className="grade-table">
        <tbody>
          <tr><td className="muted">Course code</td><td>{course.code || "—"}</td></tr>
          <tr><td className="muted">Instructor</td><td>{course.instructor || "—"}</td></tr>
          <tr><td className="muted">Credits</td><td>{course.credits}</td></tr>
          <tr>
            <td className="muted">Meetings</td>
            <td>
              {course.meetings.length === 0
                ? "—"
                : course.meetings.map((meeting, index) => (
                    <div key={index}>
                      {DAY_NAMES[meeting.day]} {meeting.start}–{meeting.end}
                      {meeting.location ? ` · ${meeting.location}` : ""}
                    </div>
                  ))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
