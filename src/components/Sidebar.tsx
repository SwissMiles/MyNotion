import React, { useRef, useState } from "react";
import { COURSE_COLORS, uid, useActiveSemester, useAppState, useDispatch } from "../store";
import type { Course, CourseMeeting, Semester } from "../types";
import { DAY_NAMES } from "../lib";
import { Field, Modal } from "./ui";
import type { View } from "../App";

export function Sidebar({
  view,
  setView,
  open,
  theme,
  toggleTheme,
}: {
  view: View;
  setView: (v: View) => void;
  open: boolean;
  theme: string;
  toggleTheme: () => void;
}) {
  const state = useAppState();
  const dispatch = useDispatch();
  const { semester, courses, tasks } = useActiveSemester();
  const [showSemModal, setShowSemModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openTasks = tasks.filter((t) => !t.done).length;

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mynotion-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(file: File) {
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text);
        if (!parsed || !Array.isArray(parsed.semesters)) throw new Error("bad format");
        dispatch({ type: "importState", state: parsed });
      } catch {
        alert("That file doesn't look like a MyNotion backup.");
      }
    });
  }

  const mainNav: { key: View["kind"]; icon: string; label: string; count?: number }[] = [
    { key: "dashboard", icon: "🏠", label: "Dashboard" },
    { key: "tasks", icon: "✅", label: "Assignments & Exams", count: openTasks },
    { key: "timetable", icon: "🗓️", label: "Timetable" },
    { key: "grades", icon: "📊", label: "Grades" },
    { key: "notes", icon: "📄", label: "All Notes" },
  ];

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-head">
        <span className="logo">🎓</span>
        <span className="name">MyNotion</span>
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="sem-picker">
        <select
          value={semester?.id ?? ""}
          onChange={(e) => dispatch({ type: "setActiveSemester", id: e.target.value })}
        >
          {state.semesters.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button className="btn small" onClick={() => setShowSemModal(true)} title="Manage semesters">
          ⚙️
        </button>
      </div>

      <nav className="nav-section">
        {mainNav.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${view.kind === item.key ? "active" : ""}`}
            onClick={() => setView({ kind: item.key } as View)}
          >
            <span>{item.icon}</span>
            <span className="label">{item.label}</span>
            {item.count ? <span className="count">{item.count}</span> : null}
          </button>
        ))}
      </nav>

      <div className="nav-section">
        <div className="nav-label">
          Courses
          <button className="icon-btn" onClick={() => { setEditCourse(null); setShowCourseModal(true); }} title="Add course">
            +
          </button>
        </div>
        {courses.map((c) => (
          <button
            key={c.id}
            className={`nav-item ${view.kind === "course" && view.courseId === c.id ? "active" : ""}`}
            onClick={() => setView({ kind: "course", courseId: c.id })}
          >
            <span className="dot" style={{ background: c.color }} />
            <span className="label">{c.code ? `${c.code} · ${c.name}` : c.name}</span>
          </button>
        ))}
        {courses.length === 0 && (
          <div className="muted" style={{ padding: "4px 10px" }}>
            No courses yet — add one!
          </div>
        )}
      </div>

      <div className="sidebar-foot">
        <button className="btn small ghost" onClick={exportData}>⬇ Export</button>
        <button className="btn small ghost" onClick={() => fileRef.current?.click()}>⬆ Import</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importData(f);
            e.target.value = "";
          }}
        />
      </div>

      {showSemModal && <SemesterModal onClose={() => setShowSemModal(false)} />}
      {showCourseModal && semester && (
        <CourseModal
          semesterId={semester.id}
          course={editCourse}
          onClose={() => setShowCourseModal(false)}
        />
      )}
    </aside>
  );
}

function SemesterModal({ onClose }: { onClose: () => void }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  function addSemester() {
    if (!name.trim()) return;
    const semester: Semester = {
      id: uid(),
      name: name.trim(),
      startDate: start || new Date().toISOString().slice(0, 10),
      endDate: end || new Date().toISOString().slice(0, 10),
    };
    dispatch({ type: "addSemester", semester });
    setName("");
    setStart("");
    setEnd("");
  }

  return (
    <Modal title="Semesters" onClose={onClose}>
      {state.semesters.map((s) => (
        <div key={s.id} className="task-row">
          <span className="title">{s.name}</span>
          <span className="muted">
            {s.startDate} → {s.endDate}
          </span>
          <button
            className="icon-btn"
            title="Delete semester"
            onClick={() => {
              if (confirm(`Delete "${s.name}" and everything in it? This can't be undone.`)) {
                dispatch({ type: "deleteSemester", id: s.id });
              }
            }}
          >
            🗑
          </button>
        </div>
      ))}
      <hr className="block-divider" />
      <Field label="New semester name">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fall 2026" />
      </Field>
      <div className="form-cols">
        <Field label="Starts">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Ends">
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary" onClick={addSemester} disabled={!name.trim()}>
          Add semester
        </button>
      </div>
    </Modal>
  );
}

export function CourseModal({
  semesterId,
  course,
  onClose,
}: {
  semesterId: string;
  course: Course | null;
  onClose: () => void;
}) {
  const dispatch = useDispatch();
  const [name, setName] = useState(course?.name ?? "");
  const [code, setCode] = useState(course?.code ?? "");
  const [instructor, setInstructor] = useState(course?.instructor ?? "");
  const [credits, setCredits] = useState(course?.credits ?? 3);
  const [color, setColor] = useState(course?.color ?? COURSE_COLORS[Math.floor(Math.random() * COURSE_COLORS.length)]);
  const [meetings, setMeetings] = useState<CourseMeeting[]>(course?.meetings ?? []);

  function save() {
    if (!name.trim()) return;
    const c: Course = {
      id: course?.id ?? uid(),
      semesterId: course?.semesterId ?? semesterId,
      name: name.trim(),
      code: code.trim(),
      instructor: instructor.trim(),
      credits: Number(credits) || 0,
      color,
      meetings: meetings.filter((m) => m.start && m.end),
    };
    dispatch(course ? { type: "updateCourse", course: c } : { type: "addCourse", course: c });
    onClose();
  }

  function setMeeting(i: number, patch: Partial<CourseMeeting>) {
    setMeetings(meetings.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  }

  return (
    <Modal title={course ? "Edit course" : "New course"} onClose={onClose}>
      <div className="form-cols">
        <Field label="Course name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Linear Algebra" autoFocus />
        </Field>
        <Field label="Code">
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="MATH 201" />
        </Field>
      </div>
      <div className="form-cols">
        <Field label="Instructor">
          <input value={instructor} onChange={(e) => setInstructor(e.target.value)} placeholder="Prof. Rivera" />
        </Field>
        <Field label="Credits">
          <input
            type="number"
            min={0}
            max={30}
            value={credits}
            onChange={(e) => setCredits(Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label="Color">
        <div className="color-row">
          {COURSE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-swatch ${c === color ? "selected" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`color ${c}`}
            />
          ))}
        </div>
      </Field>
      <Field label="Weekly meetings">
        <div>
          {meetings.map((m, i) => (
            <div key={i} className="form-cols" style={{ marginBottom: 6, alignItems: "center" }}>
              <select value={m.day} onChange={(e) => setMeeting(i, { day: Number(e.target.value) })}>
                {DAY_NAMES.map((d, di) => (
                  <option key={di} value={di}>{d}</option>
                ))}
              </select>
              <input type="time" value={m.start} onChange={(e) => setMeeting(i, { start: e.target.value })} />
              <input type="time" value={m.end} onChange={(e) => setMeeting(i, { end: e.target.value })} />
              <input
                value={m.location}
                placeholder="Room"
                onChange={(e) => setMeeting(i, { location: e.target.value })}
              />
              <button className="icon-btn" onClick={() => setMeetings(meetings.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          <button
            className="btn small"
            type="button"
            onClick={() => setMeetings([...meetings, { day: 0, start: "09:00", end: "10:00", location: "" }])}
          >
            + Add meeting time
          </button>
        </div>
      </Field>
      <div className="modal-actions">
        {course && (
          <button
            className="btn danger"
            onClick={() => {
              if (confirm(`Delete "${course.name}" with all its notes, tasks and grades?`)) {
                dispatch({ type: "deleteCourse", id: course.id });
                onClose();
              }
            }}
          >
            Delete
          </button>
        )}
        <span className="spacer" />
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={save} disabled={!name.trim()}>
          {course ? "Save" : "Add course"}
        </button>
      </div>
    </Modal>
  );
}
