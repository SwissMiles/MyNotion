import React, { useRef, useState } from "react";
import type { Task } from "../../types";
import { TASK_KIND_ICONS, TASK_REPEAT_LABELS } from "../../constants";
import { dueLabel, snoozedDue } from "../../utils/tasks";
import { useActiveSemester, useDispatch } from "../../store";
import { useUndoableDispatch } from "../../contexts/UndoContext";
import { CourseTag } from "../../components/CourseTag";

/** Width of the edit/delete tray revealed by swiping left. */
const TRAY_WIDTH = 132;
/** Swiping right past this toggles done. */
const COMPLETE_THRESHOLD = 72;
/** Ignore touches until they move this far horizontally. */
const DRAG_START = 10;

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
  const dispatchUndoable = useUndoableDispatch();
  const { courses } = useActiveSemester();
  const course = courses.find((c) => c.id === task.courseId);
  const due = dueLabel(task.due);

  function snooze() {
    dispatch({ type: "updateTask", task: { ...task, due: snoozedDue(task.due) } });
  }

  // Touch swipe: right = toggle done, left = reveal edit/delete tray.
  const [drag, setDrag] = useState<number | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const touchStart = useRef<{ x: number; y: number; dragging: boolean } | null>(null);

  const restX = trayOpen ? -TRAY_WIDTH : 0;
  const offsetX = drag ?? restX;

  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dragging: false };
  }

  function onTouchMove(e: React.TouchEvent) {
    const start = touchStart.current;
    if (!start) return;
    const dx = e.touches[0].clientX - start.x;
    const dy = e.touches[0].clientY - start.y;
    if (!start.dragging) {
      if (Math.abs(dx) < DRAG_START || Math.abs(dx) < Math.abs(dy)) return;
      start.dragging = true;
    }
    setDrag(Math.max(-TRAY_WIDTH - 32, Math.min(COMPLETE_THRESHOLD + 48, restX + dx)));
  }

  function onTouchEnd() {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start?.dragging || drag === null) return;
    if (drag > COMPLETE_THRESHOLD) {
      dispatch({ type: "toggleTask", id: task.id });
      setTrayOpen(false);
    } else {
      setTrayOpen(drag < -TRAY_WIDTH / 2);
    }
    setDrag(null);
  }

  return (
    <div className="task-swipe">
      <div
        className="task-swipe-under task-swipe-under--complete"
        style={{ opacity: offsetX > 0 ? 1 : 0 }}
        aria-hidden
      >
        {task.done ? "↩︎" : "✓"}
      </div>
      <div className="task-swipe-under task-swipe-under--tray" aria-hidden={!trayOpen}>
        <button
          className="swipe-btn swipe-btn--edit"
          tabIndex={trayOpen ? 0 : -1}
          onClick={() => {
            setTrayOpen(false);
            onEdit(task);
          }}
        >
          ✎ Edit
        </button>
        <button
          className="swipe-btn swipe-btn--delete"
          tabIndex={trayOpen ? 0 : -1}
          onClick={() => dispatchUndoable(`Deleted “${task.title}”`, { type: "deleteTask", id: task.id })}
        >
          🗑 Delete
        </button>
      </div>

      <div
        className="task-row"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: drag === null ? "transform 0.18s ease" : "none",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={trayOpen ? () => setTrayOpen(false) : undefined}
      >
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
        {task.repeat !== "none" && (
          <span className="pill repeat" title={TASK_REPEAT_LABELS[task.repeat]}>↻</span>
        )}
        {!task.done && <span className={`pill ${due.tone}`}>{due.text}</span>}
        <span className="actions">
          {!task.done && (
            <button className="icon-btn" onClick={snooze} title="Postpone by a day">💤</button>
          )}
          <button className="icon-btn" onClick={() => onEdit(task)} title="Edit">✎</button>
        </span>
      </div>
    </div>
  );
}
