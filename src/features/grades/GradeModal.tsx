import React from "react";
import type { GradeEntry } from "../../types";
import { fmtGrade, pointsToGrade, roundToQuarter } from "../../utils/grades";
import { uid } from "../../utils/id";
import { useDispatch } from "../../store";
import { useFormState } from "../../hooks/useFormState";
import { Field } from "../../components/Field";
import { Modal } from "../../components/Modal";

export function GradeModal({
  courseId,
  grade,
  onClose,
}: {
  courseId: string;
  grade: GradeEntry | null;
  onClose: () => void;
}) {
  const dispatch = useDispatch();
  const { values, setField, setValues } = useFormState({
    name: grade?.name ?? "",
    category: grade?.category ?? "",
    gradeValue: grade ? fmtGrade(grade.grade) : "",
    weight: grade?.weight ?? 10,
    score: "",
    outOf: "",
  });

  const parsedGrade = Number(values.gradeValue.replace(",", "."));
  const isValidGrade = !isNaN(parsedGrade) && parsedGrade >= 1 && parsedGrade <= 6;

  /** Fill the grade field from a points/max-points pair (quarter-rounded). */
  function applyPoints(score: string, outOf: string) {
    const next = { ...values, score, outOf };
    const scoreNum = Number(score.replace(",", "."));
    const outOfNum = Number(outOf.replace(",", "."));
    if (!isNaN(scoreNum) && !isNaN(outOfNum) && outOfNum > 0) {
      next.gradeValue = fmtGrade(roundToQuarter(pointsToGrade(scoreNum, outOfNum)));
    }
    setValues(next);
  }

  function save() {
    if (!values.name.trim() || !isValidGrade) return;
    const saved: GradeEntry = {
      id: grade?.id ?? uid(),
      courseId,
      name: values.name.trim(),
      category: values.category.trim(),
      grade: parsedGrade,
      weight: Number(values.weight) || 0,
    };
    dispatch(grade ? { type: "updateGrade", grade: saved } : { type: "addGrade", grade: saved });
    onClose();
  }

  return (
    <Modal title={grade ? "Edit grade" : "Add grade"} onClose={onClose}>
      <div className="form-cols">
        <Field label="Name">
          <input
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Midterm 1"
            autoFocus
          />
        </Field>
        <Field label="Category">
          <input
            value={values.category}
            onChange={(e) => setField("category", e.target.value)}
            placeholder="Exams"
          />
        </Field>
      </div>

      <div className="form-cols">
        <Field label="Grade (1–6)">
          <input
            type="number"
            step="0.25"
            min={1}
            max={6}
            value={values.gradeValue}
            onChange={(e) => setField("gradeValue", e.target.value)}
            placeholder="4.75"
          />
        </Field>
        <Field label="Weight (%)">
          <input
            type="number"
            step="any"
            value={values.weight}
            onChange={(e) => setField("weight", Number(e.target.value))}
          />
        </Field>
      </div>

      <Field label="…or compute from points (5 · points ⁄ max + 1, quarter-rounded)">
        <div className="form-cols">
          <input
            type="number"
            step="any"
            placeholder="Points"
            value={values.score}
            onChange={(e) => applyPoints(e.target.value, values.outOf)}
          />
          <input
            type="number"
            step="any"
            placeholder="Max points"
            value={values.outOf}
            onChange={(e) => applyPoints(values.score, e.target.value)}
          />
        </div>
      </Field>

      {values.gradeValue !== "" && !isValidGrade && (
        <p className="muted text-danger">Grade must be between 1 and 6.</p>
      )}

      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={save} disabled={!values.name.trim() || !isValidGrade}>
          {grade ? "Save" : "Add"}
        </button>
      </div>
    </Modal>
  );
}
