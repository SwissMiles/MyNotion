import React, { useState } from "react";
import { useActiveSemester } from "../store";
import { daysUntil } from "../lib";
import { TaskList, TaskModal } from "../components/tasks";
import type { Task, TaskKind } from "../types";

type Filter = "open" | "done" | "all";

export function TasksView() {
  const { semester, tasks, courses } = useActiveSemester();
  const [modalTask, setModalTask] = useState<Task | null | "new">(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [kindFilter, setKindFilter] = useState<TaskKind | "all">("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");

  if (!semester) return null;

  const filtered = tasks.filter((t) => {
    if (filter === "open" && t.done) return false;
    if (filter === "done" && !t.done) return false;
    if (kindFilter !== "all" && t.kind !== kindFilter) return false;
    if (courseFilter !== "all" && (t.courseId ?? "") !== courseFilter) return false;
    return true;
  });

  return (
    <div className="page-wrap">
      <h1 className="page-title">✅ Assignments & Exams</h1>
      <p className="page-sub">Everything due this semester, sorted by deadline.</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div className="tabs" style={{ marginBottom: 0, border: "none" }}>
          {(["open", "done", "all"] as Filter[]).map((f) => (
            <button key={f} className={`tab ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f === "open" ? "Open" : f === "done" ? "Done" : "All"}
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

      {filter === "done" ? (
        <div className="card" style={{ padding: 6 }}>
          <TaskList tasks={filtered} onEdit={(t) => setModalTask(t)} emptyText="Nothing finished yet." />
        </div>
      ) : (
        <GroupedTasks tasks={filtered} showDone={filter === "all"} onEdit={(t) => setModalTask(t)} />
      )}

      {modalTask !== null && (
        <TaskModal task={modalTask === "new" ? null : modalTask} onClose={() => setModalTask(null)} />
      )}
    </div>
  );
}

/** Open tasks bucketed by urgency, with an optional Done section at the end. */
function GroupedTasks({ tasks, showDone, onEdit }: { tasks: Task[]; showDone: boolean; onEdit: (t: Task) => void }) {
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const groups = [
    { label: "Overdue", tasks: open.filter((t) => daysUntil(t.due) < 0) },
    { label: "Today", tasks: open.filter((t) => daysUntil(t.due) === 0) },
    { label: "This week", tasks: open.filter((t) => daysUntil(t.due) >= 1 && daysUntil(t.due) <= 7) },
    { label: "Later", tasks: open.filter((t) => daysUntil(t.due) > 7) },
    ...(showDone ? [{ label: "Done", tasks: done }] : []),
  ].filter((g) => g.tasks.length > 0);

  if (groups.length === 0) {
    return <div className="empty">Nothing here — enjoy the free time 🎉</div>;
  }

  return (
    <div>
      {groups.map((g) => (
        <div key={g.label}>
          <div className="section-title" style={{ margin: "16px 0 8px" }}>
            <span>
              {g.label} <span className="muted">({g.tasks.length})</span>
            </span>
          </div>
          <div className="card" style={{ padding: 6 }}>
            <TaskList tasks={g.tasks} onEdit={onEdit} />
          </div>
        </div>
      ))}
    </div>
  );
}
