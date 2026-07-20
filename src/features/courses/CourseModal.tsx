import React from "react";
import type { Course, CourseMeeting } from "../../types";
import { COURSE_COLORS, randomCourseColor } from "../../constants";
import { uid } from "../../utils/id";
import { useDispatch } from "../../store";
import { useUndoableDispatch } from "../../contexts/UndoContext";
import { useFormState } from "../../hooks/useFormState";
import { cssVars } from "../../utils/cssVars";
import { Field } from "../../components/Field";
import { Modal } from "../../components/Modal";
import { MeetingsEditor } from "./MeetingsEditor";

interface CourseFormValues {
  name: string;
  code: string;
  instructor: string;
  credits: number;
  color: string;
  meetings: CourseMeeting[];
}

export function CourseModal({
  semesterId,
  course,
  onClose,
}: {
  semesterId: string;
  course: Course | null;
  onClose: () => void;
}) {
  const dispatch = useDispatch();
  const dispatchUndoable = useUndoableDispatch();
  const { values, setField } = useFormState<CourseFormValues>({
    name: course?.name ?? "",
    code: course?.code ?? "",
    instructor: course?.instructor ?? "",
    credits: course?.credits ?? 3,
    color: course?.color ?? randomCourseColor(),
    meetings: course?.meetings ?? [],
  });

  function save() {
    if (!values.name.trim()) return;
    const saved: Course = {
      id: course?.id ?? uid(),
      semesterId: course?.semesterId ?? semesterId,
      name: values.name.trim(),
      code: values.code.trim(),
      instructor: values.instructor.trim(),
      credits: Number(values.credits) || 0,
      color: values.color,
      meetings: values.meetings.filter((m) => m.start && m.end),
    };
    dispatch(course ? { type: "updateCourse", course: saved } : { type: "addCourse", course: saved });
    onClose();
  }

  function deleteCourse() {
    if (!course) return;
    if (confirm(`Delete "${course.name}" with all its notes, tasks and grades?`)) {
      dispatchUndoable(`Deleted “${course.name}”`, { type: "deleteCourse", id: course.id });
      onClose();
    }
  }

  return (
    <Modal title={course ? "Edit course" : "New course"} onClose={onClose}>
      <div className="form-cols">
        <Field label="Course name">
          <input
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Linear Algebra"
            autoFocus
          />
        </Field>
        <Field label="Code">
          <input value={values.code} onChange={(e) => setField("code", e.target.value)} placeholder="MATH 201" />
        </Field>
      </div>

      <div className="form-cols">
        <Field label="Instructor">
          <input
            value={values.instructor}
            onChange={(e) => setField("instructor", e.target.value)}
            placeholder="Prof. Rivera"
          />
        </Field>
        <Field label="Credits">
          <input
            type="number"
            min={0}
            max={30}
            value={values.credits}
            onChange={(e) => setField("credits", Number(e.target.value))}
          />
        </Field>
      </div>

      <Field label="Color">
        <ColorPicker value={values.color} onChange={(color) => setField("color", color)} />
      </Field>

      <Field label="Weekly meetings">
        <MeetingsEditor meetings={values.meetings} onChange={(meetings) => setField("meetings", meetings)} />
      </Field>

      <div className="modal-actions">
        {course && (
          <button className="btn danger" onClick={deleteCourse}>
            Delete
          </button>
        )}
        <span className="spacer" />
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={save} disabled={!values.name.trim()}>
          {course ? "Save" : "Add course"}
        </button>
      </div>
    </Modal>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  return (
    <div className="color-row">
      {COURSE_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`color-swatch ${color === value ? "selected" : ""}`}
          style={cssVars({ "--swatch-color": color })}
          onClick={() => onChange(color)}
          aria-label={`color ${color}`}
        />
      ))}
    </div>
  );
}
