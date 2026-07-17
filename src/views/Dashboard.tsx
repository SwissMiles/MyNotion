import React, { useState } from "react";
import { useActiveSemester } from "../store";
import { DAY_NAMES, daysUntil, fmtDateLong, semesterAverage, sortByDue } from "../lib";
import { TaskList, TaskModal } from "../components/tasks";
import type { Task } from "../types";
import type { View } from "../App";

export function Dashboard({ setView }: { setView: (v: View) => void }) {
  const { semester, courses, tasks, grades } = useActiveSemester();
  const [modalTask, setModalTask] = useState<Task | null | "new">(null);

  if (!semester) return <div className="page-wrap"><div className="empty">Create a semester to get started.</div></div>;

  const open = tasks.filter((t) => !t.done);
  const upcoming = sortByDue(open).slice(0, 6);
  const nextExam = sortByDue(open.filter((t) => t.kind === "exam" && daysUntil(t.due) >= 0))[0];
  const avg = semesterAverage(courses, grades);

  // semester progress
  const start = new Date(semester.startDate).getTime();
  const end = new Date(semester.endDate).getTime();
  const now = Date.now();
  const progress = end > start ? Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100)) : 0;
  const weekLeft = Math.max(0, Math.ceil((end - now) / (7 * 86400000)));

  // today's classes
  const jsDay = new Date().getDay(); // 0 = Sun
  const todayIdx = (jsDay + 6) % 7; // 0 = Mon
  const todaysClasses = courses
    .flatMap((c) => c.meetings.filter((m) => m.day === todayIdx).map((m) => ({ course: c, meeting: m })))
    .sort((a, b) => a.meeting.start.localeCompare(b.meeting.start));

  return (
    <div className="page-wrap">
      <h1 className="page-title">🏠 {semester.name}</h1>
      <p className="page-sub">{fmtDateLong(new Date().toISOString())} · {weekLeft} week{weekLeft === 1 ? "" : "s"} left in the semester</p>

      <div className="stat-row">
        <div className="stat">
          <div className="num">{open.length}</div>
          <div className="cap">open tasks</div>
        </div>
        <div className="stat">
          <div className="num">{nextExam ? `${daysUntil(nextExam.due)}d` : "—"}</div>
          <div className="cap">{nextExam ? `until ${nextExam.title}` : "no exams scheduled"}</div>
        </div>
        <div className="stat">
          <div className="num">{avg !== null ? avg.toFixed(2) : "—"}</div>
          <div className="cap">average grade (of 6)</div>
        </div>
        <div className="stat">
          <div className="num">{Math.round(progress)}%</div>
          <div className="cap">of semester done</div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>

      <div className="grid-2">
        <div>
          <div className="section-title">
            📌 Due soon
            <button className="btn small" onClick={() => setModalTask("new")}>+ Add</button>
          </div>
          <div className="card" style={{ padding: 6 }}>
            <TaskList tasks={upcoming} onEdit={(t) => setModalTask(t)} emptyText="Nothing due — you're ahead! 🎉" />
          </div>
        </div>
        <div>
          <div className="section-title">🗓️ Today's classes ({DAY_NAMES[todayIdx]})</div>
          <div className="card" style={{ padding: 6 }}>
            {todaysClasses.length === 0 && <div className="empty">No classes today.</div>}
            {todaysClasses.map(({ course, meeting }, i) => (
              <div key={i} className="task-row" onClick={() => setView({ kind: "course", courseId: course.id })} style={{ cursor: "pointer" }}>
                <span className="dot" style={{ width: 10, height: 10, borderRadius: 3, background: course.color, flexShrink: 0 }} />
                <span className="title">{course.code || course.name}</span>
                <span className="muted">{meeting.start}–{meeting.end}{meeting.location ? ` · ${meeting.location}` : ""}</span>
              </div>
            ))}
          </div>

          <div className="section-title">📚 Courses</div>
          <div className="card" style={{ padding: 6 }}>
            {courses.length === 0 && <div className="empty">Add your courses from the sidebar.</div>}
            {courses.map((c) => (
              <div key={c.id} className="task-row" onClick={() => setView({ kind: "course", courseId: c.id })} style={{ cursor: "pointer" }}>
                <span className="dot" style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
                <span className="title">{c.name}</span>
                <span className="muted">{c.credits} cr</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalTask !== null && (
        <TaskModal task={modalTask === "new" ? null : modalTask} onClose={() => setModalTask(null)} />
      )}
    </div>
  );
}
