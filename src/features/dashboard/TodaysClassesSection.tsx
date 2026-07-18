import React from "react";
import { DAY_NAMES } from "../../constants";
import { mondayDayIndex } from "../../utils/date";
import { courseShortLabel, meetingsForDay } from "../../utils/courses";
import { useActiveSemester } from "../../store";
import { useNavigation } from "../../contexts/NavigationContext";
import { ColorDot } from "../../components/ColorDot";

export function TodaysClassesSection() {
  const { courses } = useActiveSemester();
  const { navigate } = useNavigation();

  const todayIndex = mondayDayIndex();
  const todaysClasses = meetingsForDay(courses, todayIndex);

  return (
    <div>
      <div className="section-title">🗓️ Today's classes ({DAY_NAMES[todayIndex]})</div>
      <div className="card card--flush">
        {todaysClasses.length === 0 && <div className="empty">No classes today.</div>}
        {todaysClasses.map(({ course, meeting }, index) => (
          <div
            key={index}
            className="task-row task-row--link"
            onClick={() => navigate({ kind: "course", courseId: course.id })}
          >
            <ColorDot color={course.color} />
            <span className="title">{courseShortLabel(course)}</span>
            <span className="muted">
              {meeting.start}–{meeting.end}
              {meeting.location ? ` · ${meeting.location}` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
