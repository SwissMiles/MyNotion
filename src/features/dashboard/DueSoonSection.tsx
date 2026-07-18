import React, { useState } from "react";
import type { Task } from "../../types";
import { openTasks, sortByDue } from "../../utils/tasks";
import { useActiveSemester } from "../../store";
import { TaskList } from "../tasks/TaskList";
import { TaskModal } from "../tasks/TaskModal";

const MAX_UPCOMING = 6;

export function DueSoonSection() {
  const { tasks } = useActiveSemester();
  const [taskModal, setTaskModal] = useState<{ task: Task | null } | null>(null);

  const upcoming = sortByDue(openTasks(tasks)).slice(0, MAX_UPCOMING);

  return (
    <div>
      <div className="section-title">
        📌 Due soon
        <button className="btn small" onClick={() => setTaskModal({ task: null })}>+ Add</button>
      </div>
      <div className="card card--flush">
        <TaskList
          tasks={upcoming}
          onEdit={(task) => setTaskModal({ task })}
          emptyText="Nothing due — you're ahead! 🎉"
        />
      </div>
      {taskModal && <TaskModal task={taskModal.task} onClose={() => setTaskModal(null)} />}
    </div>
  );
}
