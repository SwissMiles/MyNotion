import React from "react";
import type { Task, TaskKind, TaskPriority } from "../../types";
import { TASK_KIND_OPTIONS, TASK_PRIORITY_OPTIONS } from "../../constants";
import { uid } from "../../utils/id";
import { isoDate } from "../../utils/date";
import { courseShortLabel } from "../../utils/courses";
import { useActiveSemester, useDispatch } from "../../store";
import { useFormState } from "../../hooks/useFormState";
import { Field } from "../../components/Field";
import { Modal } from "../../components/Modal";

export function TaskModal({
  task,
  defaultCourseId,
  defaultDue,
  onClose,
}: {
  task: Task | null;
  defaultCourseId?: string | null;
  defaultDue?: string;
  onClose: () => void;
}) {
  const dispatch = useDispatch();
  const { semester, courses } = useActiveSemester();
  const { values, setField } = useFormState({
    title: task?.title ?? "",
    courseId: task?.courseId ?? defaultCourseId ?? "",
    kind: task?.kind ?? ("assignment" as TaskKind),
    due: task?.due ?? defaultDue ?? isoDate(),
    priority: task?.priority ?? ("medium" as TaskPriority),
    notes: task?.notes ?? "",
  });

  if (!semester) return null;

  function save() {
    if (!values.title.trim() || !semester) return;
    const saved: Task = {
      id: task?.id ?? uid(),
      semesterId: semester.id,
      courseId: values.courseId || null,
      title: values.title.trim(),
      kind: values.kind,
      due: values.due,
      priority: values.priority,
      done: task?.done ?? false,
      notes: values.notes,
    };
    dispatch(task ? { type: "updateTask", task: saved } : { type: "addTask", task: saved });
    onClose();
  }

  function deleteTask() {
    if (!task) return;
    dispatch({ type: "deleteTask", id: task.id });
    onClose();
  }

  return (
    <Modal title={task ? "Edit task" : "New task"} onClose={onClose}>
      <Field label="Title">
        <input
          value={values.title}
          onChange={(e) => setField("title", e.target.value)}
          placeholder="Problem set 4"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
      </Field>

      <div className="form-cols">
        <Field label="Course">
          <select value={values.courseId} onChange={(e) => setField("courseId", e.target.value)}>
            <option value="">— Personal —</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{courseShortLabel(course)}</option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select value={values.kind} onChange={(e) => setField("kind", e.target.value as TaskKind)}>
            {TASK_KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="form-cols">
        <Field label="Due date">
          <input type="date" value={values.due} onChange={(e) => setField("due", e.target.value)} />
        </Field>
        <Field label="Priority">
          <select
            value={values.priority}
            onChange={(e) => setField("priority", e.target.value as TaskPriority)}
          >
            {TASK_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Notes (optional)">
        <textarea rows={2} value={values.notes} onChange={(e) => setField("notes", e.target.value)} />
      </Field>

      <div className="modal-actions">
        {task && (
          <button className="btn danger" onClick={deleteTask}>
            Delete
          </button>
        )}
        <span className="spacer" />
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={save} disabled={!values.title.trim()}>
          {task ? "Save" : "Add task"}
        </button>
      </div>
    </Modal>
  );
}
