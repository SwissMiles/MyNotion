import React, { useState } from "react";
import type { Task } from "../../types";
import { useActiveSemester } from "../../store";
import { useUndoableDispatch } from "../../contexts/UndoContext";
import { isoDate } from "../../utils/date";
import { NoSemesterNotice } from "../../components/NoSemesterNotice";
import { TaskFilterBar } from "./TaskFilterBar";
import { TaskList } from "./TaskList";
import { TaskRow } from "./TaskRow";
import { TaskModal } from "./TaskModal";
import { DEFAULT_TASK_FILTERS, filterTasks, groupOpenTasks } from "./taskFilters";

export function TasksView() {
  const { semester, tasks, courses } = useActiveSemester();
  const dispatchUndoable = useUndoableDispatch();
  const [filters, setFilters] = useState(DEFAULT_TASK_FILTERS);
  const [taskModal, setTaskModal] = useState<{ task: Task | null } | null>(null);

  if (!semester) {
    return <NoSemesterNotice message="Create a semester to start tracking assignments and exams." />;
  }

  const filtered = filterTasks(tasks, filters);
  // Open tasks are bucketed by urgency; done/all fall back to the flat list.
  const groups = filters.status === "open" ? groupOpenTasks(filtered) : null;

  return (
    <div className="page-wrap">
      <h1 className="page-title">✅ Assignments & Exams</h1>
      <p className="page-sub">Everything due this semester, sorted by deadline.</p>

      <TaskFilterBar
        filters={filters}
        onChange={setFilters}
        courses={courses}
        onNewTask={() => setTaskModal({ task: null })}
      />

      {groups ? (
        <>
          {groups.length === 0 && (
            <div className="empty">Nothing here — enjoy the free time 🎉</div>
          )}
          {groups.map((group) => (
            <div key={group.label}>
              <div className="section-title">
                <span className={group.tone ? `group-label ${group.tone}` : "group-label"}>
                  {group.label} · {group.tasks.length}
                </span>
                {group.label === "Overdue" && (
                  <>
                    <span className="spacer" />
                    <button
                      className="btn small ghost"
                      onClick={() =>
                        dispatchUndoable(
                          `Moved ${group.tasks.length} overdue ${group.tasks.length === 1 ? "task" : "tasks"} to today`,
                          {
                            type: "rescheduleTasks",
                            ids: group.tasks.map((t) => t.id),
                            due: isoDate(),
                          },
                        )
                      }
                    >
                      ⇥ Move all to today
                    </button>
                  </>
                )}
              </div>
              <div className="card card--flush">
                {group.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} onEdit={(t) => setTaskModal({ task: t })} />
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          {filters.status === "done" && filtered.length > 0 && (
            <div className="section-title">
              <span className="spacer" />
              <button
                className="btn small ghost danger"
                onClick={() =>
                  dispatchUndoable(
                    `Cleared ${filtered.length} completed ${filtered.length === 1 ? "task" : "tasks"}`,
                    { type: "deleteTasks", ids: filtered.map((t) => t.id) },
                  )
                }
              >
                🗑 Clear {filtered.length} completed
              </button>
            </div>
          )}
          <div className="card card--flush">
            <TaskList tasks={filtered} onEdit={(task) => setTaskModal({ task })} />
          </div>
        </>
      )}

      {taskModal && <TaskModal task={taskModal.task} onClose={() => setTaskModal(null)} />}
    </div>
  );
}
