import React from "react";
import type { GradeEntry } from "../../types";
import { fmtGrade, PASS_GRADE } from "../../utils/grades";
import { useUndoableDispatch } from "../../contexts/UndoContext";

export function GradeTable({ grades, onEdit }: { grades: GradeEntry[]; onEdit: (grade: GradeEntry) => void }) {
  const dispatchUndoable = useUndoableDispatch();

  return (
    <table className="grade-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Grade</th>
          <th>Weight</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {grades.map((grade) => (
          <tr key={grade.id}>
            <td>{grade.name}</td>
            <td><span className="pill">{grade.category || "—"}</span></td>
            <td className={`grade-value ${grade.grade < PASS_GRADE ? "text-danger" : ""}`}>
              {fmtGrade(grade.grade)}
            </td>
            <td>{grade.weight}%</td>
            <td className="cell-right">
              <button className="icon-btn" onClick={() => onEdit(grade)}>✎</button>
              <button
                className="icon-btn"
                onClick={() =>
                  dispatchUndoable(`Deleted “${grade.name}”`, { type: "deleteGrade", id: grade.id })
                }
              >
                🗑
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
