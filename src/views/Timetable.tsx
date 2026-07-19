import React, { useEffect, useRef } from "react";
import { useActiveSemester } from "../store";
import { DAY_NAMES } from "../lib";
import type { View } from "../App";

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_PX = 52;

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function Timetable({ setView }: { setView: (v: View) => void }) {
  const { semester, courses } = useActiveSemester();
  const scrollRef = useRef<HTMLDivElement>(null);

  const events = courses.flatMap((c) => c.meetings.map((m) => ({ course: c, meeting: m })));
  const showWeekend = events.some((e) => e.meeting.day >= 5);
  const days = showWeekend ? 7 : 5;
  const now = new Date();
  const todayIdx = (now.getDay() + 6) % 7;
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // on small screens the grid scrolls horizontally — start with today's column in view
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const dayWidth = (el.scrollWidth - 52) / days;
    el.scrollLeft = Math.max(0, 52 + dayWidth * todayIdx - (el.clientWidth - dayWidth) / 2);
  }, [days, todayIdx]);

  if (!semester) return null;

  const hours: number[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) hours.push(h);
  const colHeight = (END_HOUR - START_HOUR) * HOUR_PX;

  return (
    <div className="page-wrap" style={{ maxWidth: 1100 }}>
      <h1 className="page-title">🗓️ Weekly timetable</h1>
      <p className="page-sub">Class meeting times come from each course's settings — click a class to open the course.</p>

      {events.length === 0 ? (
        <div className="empty">No meeting times yet. Edit a course and add its weekly meetings to fill the timetable.</div>
      ) : (
        <div className="tt-scroll" ref={scrollRef}>
        <div className="timetable" style={{ gridTemplateColumns: `52px repeat(${days}, 1fr)` }}>
          <div className="tt-head" />
          {DAY_NAMES.slice(0, days).map((d, i) => (
            <div key={d} className={`tt-head ${i === todayIdx ? "today" : ""}`}>{d}</div>
          ))}

          <div>
            {hours.map((h) => (
              <div key={h} className="tt-time" style={{ height: HOUR_PX }}>
                {h}:00
              </div>
            ))}
          </div>

          {Array.from({ length: days }, (_, dayIdx) => (
            <div key={dayIdx} className="tt-col" style={{ height: colHeight }}>
              {hours.map((h) => (
                <div key={h} className="tt-cell" style={{ height: HOUR_PX }} />
              ))}
              {dayIdx === todayIdx && nowMin >= START_HOUR * 60 && nowMin < END_HOUR * 60 && (
                <div className="tt-now" style={{ top: ((nowMin - START_HOUR * 60) / 60) * HOUR_PX }} />
              )}
              {events
                .filter((e) => e.meeting.day === dayIdx)
                .map((e, i) => {
                  const top = ((toMin(e.meeting.start) - START_HOUR * 60) / 60) * HOUR_PX;
                  const height = Math.max(22, ((toMin(e.meeting.end) - toMin(e.meeting.start)) / 60) * HOUR_PX - 2);
                  return (
                    <div
                      key={i}
                      className="tt-event"
                      style={{ top, height, background: e.course.color, cursor: "pointer" }}
                      onClick={() => setView({ kind: "course", courseId: e.course.id })}
                      title={`${e.course.name} ${e.meeting.start}–${e.meeting.end}`}
                    >
                      <div className="ev-name">{e.course.code || e.course.name}</div>
                      {height > 40 && (
                        <div className="ev-loc">
                          {e.meeting.start}–{e.meeting.end}
                          {e.meeting.location ? ` · ${e.meeting.location}` : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
        </div>
      )}
    </div>
  );
}
