import React, { useMemo, useState } from "react";
import { useActiveSemester } from "../store";
import type { Course, CourseMeeting, Task } from "../types";
import { DAY_NAMES, TASK_KIND_ICONS, isoDateLocal, mondayDayIndex } from "../lib";
import { TaskModal } from "../components/tasks";

interface CalendarDay {
  date: Date;
  iso: string;
  inMonth: boolean;
}

/** All days shown for a month: full Monday-started weeks covering it. */
function buildMonthGrid(year: number, month: number): CalendarDay[] {
  const first = new Date(year, month, 1);
  const offset = mondayDayIndex(first);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekCount = Math.ceil((offset + daysInMonth) / 7);
  const days: CalendarDay[] = [];
  for (let i = 0; i < weekCount * 7; i++) {
    const date = new Date(year, month, 1 - offset + i);
    days.push({ date, iso: isoDateLocal(date), inMonth: date.getMonth() === month });
  }
  return days;
}

function meetingsForDay(courses: Course[], day: number): { course: Course; meeting: CourseMeeting }[] {
  return courses
    .flatMap((course) => course.meetings.filter((m) => m.day === day).map((meeting) => ({ course, meeting })))
    .sort((a, b) => a.meeting.start.localeCompare(b.meeting.start));
}

export function CalendarView() {
  const { semester, tasks, courses } = useActiveSemester();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [showClasses, setShowClasses] = useState(true);
  const [modal, setModal] = useState<{ task: Task | null; defaultDue?: string } | null>(null);

  const courseById = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      const key = task.due.slice(0, 10);
      const list = map.get(key);
      if (list) list.push(task);
      else map.set(key, [task]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => Number(a.done) - Number(b.done) || a.title.localeCompare(b.title));
    }
    return map;
  }, [tasks]);

  if (!semester) return null;

  const days = buildMonthGrid(cursor.year, cursor.month);
  const todayIso = isoDateLocal();
  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  function shiftMonth(delta: number) {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function goToday() {
    const now = new Date();
    setCursor({ year: now.getFullYear(), month: now.getMonth() });
  }

  return (
    <div className="page-wrap page-wrap--wide">
      <h1 className="page-title">📅 Calendar</h1>
      <p className="page-sub">Deadlines, exams and classes at a glance. Click a day to add a task.</p>

      <div className="cal-toolbar">
        <div className="cal-nav">
          <button className="btn small" onClick={() => shiftMonth(-1)} title="Previous month">←</button>
          <button className="btn small" onClick={goToday}>Today</button>
          <button className="btn small" onClick={() => shiftMonth(1)} title="Next month">→</button>
          <span className="cal-month-label">{monthLabel}</span>
        </div>
        <span className="spacer" />
        <label className="cal-toggle">
          <input
            type="checkbox"
            checked={showClasses}
            onChange={(e) => setShowClasses(e.target.checked)}
          />
          Show classes
        </label>
        <button className="btn primary small" onClick={() => setModal({ task: null })}>
          + New task
        </button>
      </div>

      <div className="calendar card">
        <div className="cal-grid cal-grid--head">
          {DAY_NAMES.map((name) => (
            <div key={name} className="cal-dow">{name}</div>
          ))}
        </div>
        <div className="cal-grid">
          {days.map((day) => {
            const dayTasks = tasksByDay.get(day.iso) ?? [];
            const meetings = showClasses ? meetingsForDay(courses, mondayDayIndex(day.date)) : [];
            return (
              <div
                key={day.iso}
                className={[
                  "cal-cell",
                  day.inMonth ? "" : "cal-cell--out",
                  day.iso === todayIso ? "cal-cell--today" : "",
                ].join(" ")}
                onClick={() => setModal({ task: null, defaultDue: day.iso })}
              >
                <div className="cal-daynum">{day.date.getDate()}</div>
                {meetings.map(({ course, meeting }, i) => (
                  <div
                    key={`${course.id}-${i}`}
                    className="cal-class"
                    style={{ "--cal-class-color": course.color } as React.CSSProperties}
                    title={`${course.name} · ${meeting.start}–${meeting.end}${meeting.location ? ` · ${meeting.location}` : ""}`}
                  >
                    {meeting.start} {course.code || course.name}
                  </div>
                ))}
                {dayTasks.map((task) => {
                  const course = task.courseId ? courseById.get(task.courseId) : null;
                  return (
                    <button
                      key={task.id}
                      className={`cal-task ${task.done ? "cal-task--done" : ""} ${
                        task.kind === "exam" && !task.done ? "cal-task--exam" : ""
                      }`}
                      style={{ "--cal-task-color": course?.color ?? "var(--text-3)" } as React.CSSProperties}
                      title={`${task.title}${course ? ` · ${course.code || course.name}` : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setModal({ task });
                      }}
                    >
                      {TASK_KIND_ICONS[task.kind]} {task.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <TaskModal task={modal.task} defaultDue={modal.defaultDue} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
