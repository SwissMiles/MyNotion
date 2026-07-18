import React, { useState } from "react";
import type { Course, Task } from "../../types";
import { useActiveSemester } from "../../store";
import { TaskList } from "../tasks/TaskList";
import { TaskModal } from "../tasks/TaskModal";

export function CourseTasksTab({ course }: { course: Course }) {
  const { tasks } = useActiveSemester();
  const [taskModal, setTaskModal] = useState<{ task: Task | null } | null>(null);

  const courseTasks = tasks.filter((t) => t.courseId === course.id);

  return (
    <div className="tab-panel">
      <button className="btn primary small" onClick={() => setTaskModal({ task: null })}>
        + New task
      </button>
      <div className="card card--flush">
        <TaskList tasks={courseTasks} onEdit={(task) => setTaskModal({ task })} showCourse={false} />
      </div>
      {taskModal && (
        <TaskModal task={taskModal.task} defaultCourseId={course.id} onClose={() => setTaskModal(null)} />
      )}
    </div>
  );
}
