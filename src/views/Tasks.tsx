import React, { useState } from "react";
import { useActiveSemester } from "../store";
import { TaskList, TaskModal, TaskRow } from "../components/tasks";
import { NoSemesterNotice } from "../components/ui";
import { SemesterModal } from "../components/Sidebar";
import { daysUntil, sortByDue } from "../lib";
import type { Task, TaskKind } from "../types";

type Filter = "open" | "done" | "all";

function groupOpenTasks(tasks: Task[]): { label: string; tone?: "overdue" | "soon"; tasks: Task[] }[] {
  const sorted = sortByDue(tasks);
  const groups = [
    { label: "Overdue", tone: "overdue" as const, tasks: [] as Task[] },
    { label: "Today", tone: "soon" as const, tasks: [] as Task[] },
    { label: "This week", tasks: [] as Task[] },
    { label: "Later", tasks: [] as Task[] },
  ];
  for (const t of sorted) {
    const d = daysUntil(t.due);
    if (d < 0) groups[0].tasks.push(t);
    else if (d === 0) groups[1].tasks.push(t);
    else if (d <= 7) groups[2].tasks.push(t);
    else groups[3].tasks.push(t);
  }
  return groups.filter((g) => g.tasks.length > 0);
}

export function TasksView() {
  const { semester, tasks, courses } = useActiveSemester();
  const [modalTask, setModalTask] = useState<Task | null | "new">(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [kindFilter, setKindFilter] = useState<TaskKind | "all">("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [showSemModal, setShowSemModal] = useState(false);

  if (!semester) {
    return (
      <>
        <NoSemesterNotice
          message="Create a semester to start tracking assignments and exams."
          onCreateSemester={() => setShowSemModal(true)}
        />
        {showSemModal && <SemesterModal onClose={() => setShowSemModal(false)} />}
      </>
    );
  }

  const filtered = tasks.filter((t) => {
    if (kindFilter !== "all" && t.kind !== kindFilter) return false;
    if (courseFilter !== "all" && (t.courseId ?? "") !== courseFilter) return false;
    return true;
  });
  const open = filtered.filter((t) => !t.done);
  const done = filtered.filter((t) => t.done);
  const groups = filter === "done" ? [] : groupOpenTasks(open);
  const showDone = filter !== "open";

  return (
    <div className="page-wrap">
      <h1 className="page-title">✅ Assignments & Exams</h1>
      <p className="page-sub">Everything due this semester, sorted by deadline.</p>

      <div className="toolbar">
        <div className="tabs" style={{ marginBottom: 0, border: "none" }}>
          {(["open", "done", "all"] as Filter[]).map((f) => (
            <button key={f} className={`tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f === "open" ? `Open (${open.length})` : f === "done" ? `Done (${done.length})` : "All"}
            </button>
          ))}
        </div>
        <span className="spacer" />
        <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as TaskKind | "all")} className="btn small">
          <option value="all">All types</option>
          <option value="assignment">Assignments</option>
          <option value="exam">Exams</option>
          <option value="reading">Readings</option>
          <option value="project">Projects</option>
          <option value="other">Other</option>
        </select>
        <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="btn small">
          <option value="all">All courses</option>
          <option value="">Personal</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.code || c.name}</option>
          ))}
        </select>
        <button className="btn primary small" onClick={() => setModalTask("new")}>+ New task</button>
      </div>

      {groups.length === 0 && !(showDone && done.length > 0) && (
        <div className="empty">Nothing here — enjoy the free time 🎉</div>
      )}

      {groups.map((g) => (
        <div key={g.label}>
          <div className="section-title">
            <span className={g.tone ? `group-label ${g.tone}` : "group-label"}>
              {g.label} · {g.tasks.length}
            </span>
          </div>
          <div className="card list-card">
            {g.tasks.map((t) => (
              <TaskRow key={t.id} task={t} onEdit={(x) => setModalTask(x)} />
            ))}
          </div>
        </div>
      ))}

      {showDone && done.length > 0 && (
        <div>
          <div className="section-title">
            <span className="group-label">Done · {done.length}</span>
          </div>
          <div className="card list-card">
            <TaskList tasks={done} onEdit={(t) => setModalTask(t)} />
          </div>
        </div>
      )}

      {modalTask !== null && (
        <TaskModal task={modalTask === "new" ? null : modalTask} onClose={() => setModalTask(null)} />
      )}
    </div>
  );
}
