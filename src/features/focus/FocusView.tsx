import React from "react";
import { useActiveSemester, useDispatch } from "../../store";
import { FOCUS_PRESETS, fmtClock, useFocus } from "../../contexts/FocusContext";
import { isoDate } from "../../utils/date";
import { courseShortLabel } from "../../utils/courses";
import { cssVars } from "../../utils/cssVars";
import {
  fmtMinutes,
  minutesByCourse,
  sessionsInLastDays,
  sessionsOnDay,
  totalMinutes,
} from "../../utils/studySessions";
import { ColorDot } from "../../components/ColorDot";
import { NoSemesterNotice } from "../../components/NoSemesterNotice";

export function FocusView() {
  const { semester, courses, sessions } = useActiveSemester();
  const focus = useFocus();
  const dispatch = useDispatch();

  if (!semester) {
    return <NoSemesterNotice message="Create a semester to start tracking study time." />;
  }

  const todaySessions = sessionsOnDay(sessions, isoDate());
  const weekSessions = sessionsInLastDays(sessions, 7);
  const perCourse = minutesByCourse(weekSessions);
  const maxCourseMinutes = perCourse[0]?.minutes ?? 0;
  const recent = [...sessions]
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, 8);

  const isFocus = focus.phase === "focus";

  return (
    <div className="page-wrap">
      <h1 className="page-title">⏱️ Focus</h1>
      <p className="page-sub">
        Pomodoro-style focus sessions, logged per course — see where your study time actually goes.
      </p>

      <div className={`card focus-card ${isFocus ? "" : "focus-card--break"}`}>
        <div className="focus-phase">{isFocus ? "Focus" : "Break"}</div>
        <div className="focus-clock">{fmtClock(focus.secondsLeft)}</div>

        {!focus.active && (
          <div className="focus-setup">
            {isFocus && (
              <select
                value={focus.courseId ?? ""}
                onChange={(e) => focus.setCourseId(e.target.value || null)}
                title="What are you studying?"
              >
                <option value="">— General studying —</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{courseShortLabel(course)}</option>
                ))}
              </select>
            )}
            <div className="focus-presets">
              {FOCUS_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  className={`btn small ${preset.label === focus.preset.label ? "primary" : ""}`}
                  onClick={() => focus.setPreset(preset)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="focus-actions">
          {!focus.active && (
            <button className="btn primary focus-main-btn" onClick={focus.start}>
              ▶ Start {isFocus ? "focus" : "break"}
            </button>
          )}
          {focus.active && focus.running && (
            <button className="btn focus-main-btn" onClick={focus.pause}>⏸ Pause</button>
          )}
          {focus.active && !focus.running && (
            <button className="btn primary focus-main-btn" onClick={focus.resume}>▶ Resume</button>
          )}
          {focus.active && isFocus && (
            <>
              <button className="btn small" onClick={focus.finishEarly}>Finish early</button>
              <button className="btn ghost small" onClick={focus.abandon}>Give up</button>
            </>
          )}
          {!isFocus && (
            <button className="btn ghost small" onClick={focus.skipBreak}>Skip break</button>
          )}
        </div>
        {focus.completedToday > 0 && (
          <div className="muted focus-streak">
            {"🍅".repeat(Math.min(focus.completedToday, 12))} {focus.completedToday} focus
            {focus.completedToday === 1 ? " session" : " sessions"} completed today
          </div>
        )}
      </div>

      <div className="stat-row stat-row--3">
        <div className="stat">
          <div className="num">{fmtMinutes(totalMinutes(todaySessions))}</div>
          <div className="cap">studied today</div>
        </div>
        <div className="stat">
          <div className="num">{fmtMinutes(totalMinutes(weekSessions))}</div>
          <div className="cap">last 7 days</div>
        </div>
        <div className="stat">
          <div className="num">{weekSessions.length}</div>
          <div className="cap">sessions this week</div>
        </div>
      </div>

      {perCourse.length > 0 && (
        <>
          <div className="section-title">📚 This week by course</div>
          <div className="card">
            {perCourse.map(({ courseId, minutes }) => {
              const course = courses.find((c) => c.id === courseId) ?? null;
              return (
                <div key={courseId || "general"} className="focus-bar-row">
                  <span className="focus-bar-label">
                    <ColorDot color={course?.color ?? "var(--text-3)"} />
                    {course ? courseShortLabel(course) : "General"}
                  </span>
                  <div className="focus-bar-track">
                    <div
                      className="focus-bar-fill"
                      style={cssVars({
                        "--bar-width": `${Math.max(4, (minutes / maxCourseMinutes) * 100)}%`,
                        "--bar-color": course?.color ?? "var(--text-3)",
                      })}
                    />
                  </div>
                  <span className="focus-bar-minutes">{fmtMinutes(minutes)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {recent.length > 0 && (
        <>
          <div className="section-title">🕘 Recent sessions</div>
          <div className="card card--flush">
            {recent.map((session) => {
              const course = session.courseId
                ? courses.find((c) => c.id === session.courseId) ?? null
                : null;
              const started = new Date(session.startedAt);
              return (
                <div key={session.id} className="task-row">
                  <ColorDot color={course?.color ?? "var(--text-3)"} />
                  <span className="title">{course ? courseShortLabel(course) : "General"}</span>
                  <span className="muted">
                    {started.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}{" "}
                    · {fmtMinutes(session.minutes)}
                  </span>
                  <button
                    className="icon-btn"
                    title="Delete session"
                    onClick={() => dispatch({ type: "deleteSession", id: session.id })}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
