import React, { useState } from "react";
import { useActiveSemester, useDispatch } from "../store";
import { DAY_NAMES } from "../lib";
import { CourseModal } from "../components/Sidebar";
import { TaskList, TaskModal } from "../components/tasks";
import { CourseGrades } from "./Grades";
import { PageListItem, newPage } from "./Notes";
import type { Task } from "../types";
import type { View } from "../App";

export type CourseTab = "notes" | "tasks" | "grades" | "info";

export function CourseView({
  courseId,
  tab,
  setView,
}: {
  courseId: string;
  tab?: CourseTab;
  setView: (v: View) => void;
}) {
  const { semester, courses, tasks, pages } = useActiveSemester();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<CourseTab>(tab ?? "notes");
  const [modalTask, setModalTask] = useState<Task | null | "new">(null);
  const [editCourse, setEditCourse] = useState(false);

  const course = courses.find((c) => c.id === courseId);
  if (!course || !semester) {
    return (
      <div className="page-wrap">
        <div className="empty">Course not found in this semester.</div>
      </div>
    );
  }

  const courseTasks = tasks.filter((t) => t.courseId === course.id);
  const coursePages = pages.filter((p) => p.courseId === course.id);
  const openCount = courseTasks.filter((t) => !t.done).length;

  function createPage() {
    if (!semester || !course) return;
    const page = newPage(semester.id, course.id);
    dispatch({ type: "addPage", page });
    setView({ kind: "page", pageId: page.id });
  }

  const tabs: { key: CourseTab; label: string }[] = [
    { key: "notes", label: `Notes (${coursePages.length})` },
    { key: "tasks", label: `Tasks (${openCount})` },
    { key: "grades", label: "Grades" },
    { key: "info", label: "Info" },
  ];

  return (
    <div className="page-wrap">
      <div className="course-header-band" style={{ background: course.color }} />
      <h1 className="page-title">
        {course.code ? `${course.code} · ` : ""}{course.name}
        <span className="spacer" />
        <button className="btn small" onClick={() => setEditCourse(true)}>Edit</button>
      </h1>
      <p className="page-sub">
        {course.instructor ? `${course.instructor} · ` : ""}
        {course.credits} credit{course.credits === 1 ? "" : "s"}
        {course.meetings.length > 0 &&
          ` · ${course.meetings.map((m) => `${DAY_NAMES[m.day]} ${m.start}`).join(", ")}`}
      </p>

      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.key} className={`tab ${activeTab === t.key ? "active" : ""}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "notes" && (
        <div>
          <button className="btn primary small" onClick={createPage}>+ New page</button>
          <div className="card" style={{ padding: 6, marginTop: 12 }}>
            {coursePages.length === 0 ? (
              <div className="empty">No notes for this course yet — lecture notes, summaries, cheat sheets all go here.</div>
            ) : (
              coursePages
                .slice()
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .map((p) => <PageListItem key={p.id} page={p} onOpen={() => setView({ kind: "page", pageId: p.id })} />)
            )}
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <div>
          <button className="btn primary small" onClick={() => setModalTask("new")}>+ New task</button>
          <div className="card" style={{ padding: 6, marginTop: 12 }}>
            <TaskList tasks={courseTasks} onEdit={(t) => setModalTask(t)} showCourse={false} />
          </div>
        </div>
      )}

      {activeTab === "grades" && <CourseGrades course={course} />}

      {activeTab === "info" && (
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
                    : course.meetings.map((m, i) => (
                        <div key={i}>
                          {DAY_NAMES[m.day]} {m.start}–{m.end}
                          {m.location ? ` · ${m.location}` : ""}
                        </div>
                      ))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {modalTask !== null && (
        <TaskModal
          task={modalTask === "new" ? null : modalTask}
          defaultCourseId={course.id}
          onClose={() => setModalTask(null)}
        />
      )}
      {editCourse && <CourseModal semesterId={semester.id} course={course} onClose={() => setEditCourse(false)} />}
    </div>
  );
}
