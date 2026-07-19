import React, { useRef, useState } from "react";
import type { Course } from "../../types";
import { DAY_NAMES, DAY_NAMES_FULL } from "../../constants";
import { mondayDayIndex } from "../../utils/date";
import { meetingsForDay, timeToMinutes, type ScheduledMeeting } from "../../utils/courses";
import { cssVars } from "../../utils/cssVars";
import { useNavigation } from "../../contexts/NavigationContext";

const SWIPE_THRESHOLD = 48;

/**
 * Phone-friendly timetable: one day at a time as an agenda list, with day
 * chips on top. Swipe left/right anywhere on the list to change day.
 */
export function DayAgenda({ courses, dayCount }: { courses: Course[]; dayCount: number }) {
  const todayIndex = mondayDayIndex();
  const [day, setDay] = useState(Math.min(todayIndex, dayCount - 1));
  const meetings = meetingsForDay(courses, day);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    setDay((d) => Math.min(dayCount - 1, Math.max(0, d - Math.sign(dx))));
  }

  return (
    <div className="day-agenda">
      <div className="day-chips" role="tablist" aria-label="Day of week">
        {DAY_NAMES.slice(0, dayCount).map((name, index) => (
          <button
            key={name}
            role="tab"
            aria-selected={index === day}
            className={`day-chip ${index === day ? "active" : ""} ${index === todayIndex ? "today" : ""}`}
            onClick={() => setDay(index)}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="agenda-list" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <div className="agenda-day-name">
          {DAY_NAMES_FULL[day]}
          {day === todayIndex && <span className="pill ok">Today</span>}
        </div>
        {meetings.length === 0 ? (
          <div className="empty">No classes on {DAY_NAMES_FULL[day]} — enjoy the free day! 🎉</div>
        ) : (
          meetings.map((meeting, index) => <AgendaCard key={index} event={meeting} />)
        )}
      </div>
    </div>
  );
}

function AgendaCard({ event }: { event: ScheduledMeeting }) {
  const { navigate } = useNavigation();
  const { course, meeting } = event;
  const minutes = timeToMinutes(meeting.end) - timeToMinutes(meeting.start);

  return (
    <button
      className="agenda-card"
      style={cssVars({ "--agenda-color": course.color })}
      onClick={() => navigate({ kind: "course", courseId: course.id })}
    >
      <span className="agenda-band" />
      <span className="agenda-time">
        <span>{meeting.start}</span>
        <span className="agenda-end">{meeting.end}</span>
      </span>
      <span className="agenda-main">
        <span className="agenda-name">{course.name}</span>
        <span className="agenda-meta">
          {course.code && <span>{course.code}</span>}
          {meeting.location && <span>📍 {meeting.location}</span>}
          <span>{minutes >= 60 ? `${(minutes / 60).toFixed(minutes % 60 ? 1 : 0)} h` : `${minutes} min`}</span>
        </span>
      </span>
    </button>
  );
}
