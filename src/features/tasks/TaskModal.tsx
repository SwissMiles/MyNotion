import React from "react";
import type { Task, TaskKind, TaskPriority, TaskRepeat } from "../../types";
import { TASK_KIND_OPTIONS, TASK_PRIORITY_OPTIONS, TASK_REPEAT_OPTIONS } from "../../constants";
import { uid } from "../../utils/id";
import { isoDate, isoDatePlusDays } from "../../utils/date";
import { courseShortLabel } from "../../utils/courses";
import { useActiveSemester, useDispatch } from "../../store";
import { useUndoableDispatch } from "../../contexts/UndoContext";
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
  /** Pre-filled due date ("YYYY-MM-DD") for tasks created from the calendar. */
  defaultDue?: string;
  onClose: () => void;
}) {
  const dispatch = useDispatch();
  const dispatchUndoable = useUndoableDispatch();
  const { semester, courses } = useActiveSemester();
  const { values, setField } = useFormState({
    title: task?.title ?? "",
    courseId: task?.courseId ?? defaultCourseId ?? "",
    kind: task?.kind ?? ("assignment" as TaskKind),
    due: task?.due ?? defaultDue ?? isoDate(),
    priority: task?.priority ?? ("medium" as TaskPriority),
    repeat: task?.repeat ?? ("none" as TaskRepeat),
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
      repeat: values.repeat,
    };
    dispatch(task ? { type: "updateTask", task: saved } : { type: "addTask", task: saved });
    onClose();
  }

  function deleteTask() {
    if (!task) return;
    dispatchUndoable(`Deleted “${task.title}”`, { type: "deleteTask", id: task.id });
    onClose();
  }

  const DUE_PRESETS = [
    { label: "Today", due: isoDate() },
    { label: "Tomorrow", due: isoDatePlusDays(1) },
    { label: "Next week", due: isoDatePlusDays(7) },
  ];

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
          <div className="due-presets">
            {DUE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className={`btn small ${values.due === preset.due ? "" : "ghost"}`}
                onClick={() => setField("due", preset.due)}
              >
                {preset.label}
              </button>
            ))}
          </div>
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
        <Field label="Repeat">
          <select
            value={values.repeat}
            onChange={(e) => setField("repeat", e.target.value as TaskRepeat)}
          >
            {TASK_REPEAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </Field>
      </div>
      {values.repeat !== "none" && (
        <p className="muted repeat-hint">
          Completing this task automatically schedules the next occurrence (until the semester
          ends).
        </p>
      )}

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
