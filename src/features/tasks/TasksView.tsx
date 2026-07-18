import React, { useState } from "react";
import type { Task } from "../../types";
import { useActiveSemester } from "../../store";
import { TaskFilterBar } from "./TaskFilterBar";
import { TaskList } from "./TaskList";
import { TaskModal } from "./TaskModal";
import { DEFAULT_TASK_FILTERS, filterTasks } from "./taskFilters";

export function TasksView() {
  const { semester, tasks, courses } = useActiveSemester();
  const [filters, setFilters] = useState(DEFAULT_TASK_FILTERS);
  const [taskModal, setTaskModal] = useState<{ task: Task | null } | null>(null);

  if (!semester) return null;

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

      <div className="card card--flush">
        <TaskList tasks={filterTasks(tasks, filters)} onEdit={(task) => setTaskModal({ task })} />
      </div>

      {taskModal && <TaskModal task={taskModal.task} onClose={() => setTaskModal(null)} />}
    </div>
  );
}
