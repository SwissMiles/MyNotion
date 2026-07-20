import React from "react";
import type { Semester } from "../../types";
import { uid } from "../../utils/id";
import { isoDate } from "../../utils/date";
import { useAppState, useDispatch } from "../../store";
import { useUndoableDispatch } from "../../contexts/UndoContext";
import { useFormState } from "../../hooks/useFormState";
import { Field } from "../../components/Field";
import { Modal } from "../../components/Modal";

export function SemesterModal({ onClose }: { onClose: () => void }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const { values, setField, setValues } = useFormState({ name: "", start: "", end: "" });

  function addSemester() {
    if (!values.name.trim()) return;
    const semester: Semester = {
      id: uid(),
      name: values.name.trim(),
      startDate: values.start || isoDate(),
      endDate: values.end || isoDate(),
    };
    dispatch({ type: "addSemester", semester });
    setValues({ name: "", start: "", end: "" });
  }

  return (
    <Modal title="Semesters" onClose={onClose}>
      {state.semesters.map((semester) => (
        <SemesterRow key={semester.id} semester={semester} />
      ))}
      <hr className="block-divider" />

      <Field label="New semester name">
        <input
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="e.g. Fall 2026"
        />
      </Field>
      <div className="form-cols">
        <Field label="Starts">
          <input type="date" value={values.start} onChange={(e) => setField("start", e.target.value)} />
        </Field>
        <Field label="Ends">
          <input type="date" value={values.end} onChange={(e) => setField("end", e.target.value)} />
        </Field>
      </div>

      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Close</button>
        <button className="btn primary" onClick={addSemester} disabled={!values.name.trim()}>
          Add semester
        </button>
      </div>
    </Modal>
  );
}

function SemesterRow({ semester }: { semester: Semester }) {
  const dispatchUndoable = useUndoableDispatch();

  function deleteSemester() {
    if (confirm(`Delete "${semester.name}" and everything in it?`)) {
      dispatchUndoable(`Deleted “${semester.name}”`, { type: "deleteSemester", id: semester.id });
    }
  }

  return (
    <div className="task-row">
      <span className="title">{semester.name}</span>
      <span className="muted">
        {semester.startDate} → {semester.endDate}
      </span>
      <button className="icon-btn" title="Delete semester" onClick={deleteSemester}>
        🗑
      </button>
    </div>
  );
}
