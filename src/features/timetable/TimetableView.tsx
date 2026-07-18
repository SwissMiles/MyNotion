import React from "react";
import { DAY_NAMES } from "../../constants";
import { mondayDayIndex } from "../../utils/date";
import { allMeetings, courseShortLabel, timeToMinutes, type ScheduledMeeting } from "../../utils/courses";
import { cssVars } from "../../utils/cssVars";
import { useActiveSemester } from "../../store";
import { useNavigation } from "../../contexts/NavigationContext";

const START_HOUR = 7;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

export function TimetableView() {
  const { semester, courses } = useActiveSemester();
  if (!semester) return null;

  const events = allMeetings(courses);
  const showWeekend = events.some((e) => e.meeting.day >= 5);
  const dayCount = showWeekend ? 7 : 5;
  const todayIndex = mondayDayIndex();

  return (
    <div className="page-wrap page-wrap--wide">
      <h1 className="page-title">🗓️ Weekly timetable</h1>
      <p className="page-sub">
        Class meeting times come from each course's settings — click a class to open the course.
      </p>

      {events.length === 0 ? (
        <div className="empty">
          No meeting times yet. Edit a course and add its weekly meetings to fill the timetable.
        </div>
      ) : (
        <div
          className="timetable"
          style={cssVars({ "--tt-day-count": dayCount, "--tt-hour-count": HOURS.length })}
        >
          <div className="tt-head" />
          {DAY_NAMES.slice(0, dayCount).map((day, index) => (
            <div key={day} className={`tt-head ${index === todayIndex ? "today" : ""}`}>{day}</div>
          ))}

          <div>
            {HOURS.map((hour) => (
              <div key={hour} className="tt-time">{hour}:00</div>
            ))}
          </div>

          {Array.from({ length: dayCount }, (_, dayIndex) => (
            <DayColumn key={dayIndex} events={events.filter((e) => e.meeting.day === dayIndex)} />
          ))}
        </div>
      )}
    </div>
  );
}

function DayColumn({ events }: { events: ScheduledMeeting[] }) {
  return (
    <div className="tt-col">
      {HOURS.map((hour) => (
        <div key={hour} className="tt-cell" />
      ))}
      {events.map((event, index) => (
        <EventBlock key={index} event={event} />
      ))}
    </div>
  );
}

function EventBlock({ event }: { event: ScheduledMeeting }) {
  const { navigate } = useNavigation();
  const { course, meeting } = event;

  const startHours = (timeToMinutes(meeting.start) - START_HOUR * 60) / 60;
  const durationHours = (timeToMinutes(meeting.end) - timeToMinutes(meeting.start)) / 60;
  const showDetails = durationHours > 0.8;

  return (
    <div
      className="tt-event"
      style={cssVars({
        "--tt-event-start": startHours,
        "--tt-event-duration": durationHours,
        "--tt-event-color": course.color,
      })}
      onClick={() => navigate({ kind: "course", courseId: course.id })}
      title={`${course.name} ${meeting.start}–${meeting.end}`}
    >
      <div className="ev-name">{courseShortLabel(course)}</div>
      {showDetails && (
        <div className="ev-loc">
          {meeting.start}–{meeting.end}
          {meeting.location ? ` · ${meeting.location}` : ""}
        </div>
      )}
    </div>
  );
}
