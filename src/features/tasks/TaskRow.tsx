import React from "react";
import type { Task } from "../../types";
import { TASK_KIND_ICONS } from "../../constants";
import { dueLabel } from "../../utils/tasks";
import { useActiveSemester, useDispatch } from "../../store";
import { CourseTag } from "../../components/CourseTag";

export function TaskRow({
  task,
  onEdit,
  showCourse = true,
}: {
  task: Task;
  onEdit: (task: Task) => void;
  showCourse?: boolean;
}) {
  const dispatch = useDispatch();
  const { courses } = useActiveSemester();
  const course = courses.find((c) => c.id === task.courseId);
  const due = dueLabel(task.due);

  return (
    <div className="task-row">
      <span className={`prio ${task.priority}`} />
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => dispatch({ type: "toggleTask", id: task.id })}
      />
      <span title={task.kind}>{TASK_KIND_ICONS[task.kind]}</span>
      <span className={`title ${task.done ? "done" : ""}`} title={task.notes || task.title}>
        {task.title}
      </span>
      {showCourse && course && <CourseTag course={course} />}
      {!task.done && <span className={`pill ${due.tone}`}>{due.text}</span>}
      <span className="actions">
        <button className="icon-btn" onClick={() => onEdit(task)} title="Edit">✎</button>
      </span>
    </div>
  );
}
