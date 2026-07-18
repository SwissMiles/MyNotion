import React, { useState } from "react";
import { uid, useActiveSemester, useDispatch } from "../store";
import type { Task, TaskKind, TaskPriority } from "../types";
import { TASK_KIND_ICONS, dueLabel, sortByDue } from "../lib";
import { Field, Modal, useToast } from "./ui";

export function TaskModal({
  task,
  defaultCourseId,
  onClose,
}: {
  task: Task | null;
  defaultCourseId?: string | null;
  onClose: () => void;
}) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { semester, courses } = useActiveSemester();
  const [title, setTitle] = useState(task?.title ?? "");
  const [courseId, setCourseId] = useState<string>(task?.courseId ?? defaultCourseId ?? "");
  const [kind, setKind] = useState<TaskKind>(task?.kind ?? "assignment");
  const [due, setDue] = useState(task?.due ?? new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [notes, setNotes] = useState(task?.notes ?? "");

  if (!semester) return null;

  function save() {
    if (!title.trim() || !semester) return;
    const t: Task = {
      id: task?.id ?? uid(),
      semesterId: semester.id,
      courseId: courseId || null,
      title: title.trim(),
      kind,
      due,
      priority,
      done: task?.done ?? false,
      notes,
    };
    dispatch(task ? { type: "updateTask", task: t } : { type: "addTask", task: t });
    onClose();
  }

  return (
    <Modal title={task ? "Edit task" : "New task"} onClose={onClose}>
      <Field label="Title">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Problem set 4"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
      </Field>
      <div className="form-cols">
        <Field label="Course">
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">— Personal —</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code || c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select value={kind} onChange={(e) => setKind(e.target.value as TaskKind)}>
            <option value="assignment">📝 Assignment</option>
            <option value="exam">🎯 Exam</option>
            <option value="reading">📖 Reading</option>
            <option value="project">🛠️ Project</option>
            <option value="other">📌 Other</option>
          </select>
        </Field>
      </div>
      <div className="form-cols">
        <Field label="Due date">
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        </Field>
        <Field label="Priority">
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
      </div>
      <Field label="Notes (optional)">
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="modal-actions">
        {task && (
          <button
            className="btn danger"
            onClick={() => {
              dispatch({ type: "deleteTask", id: task.id });
              toast(`Deleted "${task.title}"`, { label: "Undo", run: () => dispatch({ type: "addTask", task }) });
              onClose();
            }}
          >
            Delete
          </button>
        )}
        <span className="spacer" />
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={save} disabled={!title.trim()}>
          {task ? "Save" : "Add task"}
        </button>
      </div>
    </Modal>
  );
}

export function TaskRow({ task, onEdit, showCourse = true }: { task: Task; onEdit: (t: Task) => void; showCourse?: boolean }) {
  const dispatch = useDispatch();
  const toast = useToast();
  const { courses } = useActiveSemester();
  const course = courses.find((c) => c.id === task.courseId);
  const due = dueLabel(task.due);

  function toggle() {
    dispatch({ type: "toggleTask", id: task.id });
    if (!task.done) {
      toast(`Completed "${task.title}" 🎉`, { label: "Undo", run: () => dispatch({ type: "toggleTask", id: task.id }) });
    }
  }

  const hasMeta = (showCourse && course) || !task.done;

  return (
    <div className="task-row">
      <span className={`prio ${task.priority}`} />
      <input type="checkbox" checked={task.done} onChange={toggle} />
      <span title={task.kind}>{TASK_KIND_ICONS[task.kind]}</span>
      <div className="task-main">
        <button className={`title title-btn ${task.done ? "done" : ""}`} title={task.notes || task.title} onClick={() => onEdit(task)}>
          {task.title}
        </button>
        {hasMeta && (
          <span className="task-meta">
            {showCourse && course && (
              <span className="course-tag" style={{ background: course.color }}>
                {course.code || course.name}
              </span>
            )}
            {!task.done && <span className={`pill ${due.tone}`}>{due.text}</span>}
          </span>
        )}
      </div>
      <span className="actions">
        <button className="icon-btn" onClick={() => onEdit(task)} title="Edit">✎</button>
      </span>
    </div>
  );
}

export function TaskList({
  tasks,
  onEdit,
  showCourse = true,
  emptyText = "Nothing here — enjoy the free time 🎉",
}: {
  tasks: Task[];
  onEdit: (t: Task) => void;
  showCourse?: boolean;
  emptyText?: string;
}) {
  if (tasks.length === 0) return <div className="empty">{emptyText}</div>;
  return (
    <div>
      {sortByDue(tasks).map((t) => (
        <TaskRow key={t.id} task={t} onEdit={onEdit} showCourse={showCourse} />
      ))}
    </div>
  );
}
