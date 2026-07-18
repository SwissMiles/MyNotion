import React from "react";
import type { Task } from "../../types";
import { sortByDue } from "../../utils/tasks";
import { TaskRow } from "./TaskRow";

export function TaskList({
  tasks,
  onEdit,
  showCourse = true,
  emptyText = "Nothing here — enjoy the free time 🎉",
}: {
  tasks: Task[];
  onEdit: (task: Task) => void;
  showCourse?: boolean;
  emptyText?: string;
}) {
  if (tasks.length === 0) return <div className="empty">{emptyText}</div>;
  return (
    <div>
      {sortByDue(tasks).map((task) => (
        <TaskRow key={task.id} task={task} onEdit={onEdit} showCourse={showCourse} />
      ))}
    </div>
  );
}
