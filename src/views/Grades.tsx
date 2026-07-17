import React, { useState } from "react";
import { uid, useActiveSemester, useDispatch } from "../store";
import { courseGrade, letterGrade, percentToGpa, semesterGpa } from "../lib";
import type { Course, GradeEntry } from "../types";
import { Field, Modal } from "../components/ui";
import type { View } from "../App";

export function GradesView({ setView }: { setView: (v: View) => void }) {
  const { semester, courses, grades } = useActiveSemester();
  if (!semester) return null;

  const gpa = semesterGpa(courses, grades);
  const graded = courses.filter((c) => courseGrade(grades.filter((g) => g.courseId === c.id)) !== null);

  return (
    <div className="page-wrap">
      <h1 className="page-title">📊 Grades & GPA</h1>
      <p className="page-sub">Weighted averages per course, combined into a credit-weighted semester GPA.</p>

      <div className="stat-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat">
          <div className="num">{gpa !== null ? gpa.toFixed(2) : "—"}</div>
          <div className="cap">semester GPA (4.0 scale)</div>
        </div>
        <div className="stat">
          <div className="num">{graded.length}/{courses.length}</div>
          <div className="cap">courses with grades</div>
        </div>
        <div className="stat">
          <div className="num">{courses.reduce((s, c) => s + c.credits, 0)}</div>
          <div className="cap">total credits</div>
        </div>
      </div>

      {courses.length === 0 && <div className="empty">Add courses first — grades live inside each course.</div>}

      {courses.map((c) => {
        const cg = grades.filter((g) => g.courseId === c.id);
        const pct = courseGrade(cg);
        return (
          <div key={c.id} className="card" style={{ marginTop: 14, cursor: "pointer" }} onClick={() => setView({ kind: "course", courseId: c.id, tab: "grades" })}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: c.color }} />
              <b>{c.code ? `${c.code} · ` : ""}{c.name}</b>
              <span className="muted">{c.credits} cr · {cg.length} grade{cg.length === 1 ? "" : "s"}</span>
              <span className="spacer" />
              {pct !== null ? (
                <>
                  <span className="pill ok">{letterGrade(pct)}</span>
                  <b>{pct.toFixed(1)}%</b>
                </>
              ) : (
                <span className="muted">no grades yet</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Grade table for a single course (used inside CourseView). */
export function CourseGrades({ course }: { course: Course }) {
  const { grades } = useActiveSemester();
  const dispatch = useDispatch();
  const [editing, setEditing] = useState<GradeEntry | null | "new">(null);

  const cg = grades.filter((g) => g.courseId === course.id);
  const pct = courseGrade(cg);
  const totalWeight = cg.reduce((s, g) => s + g.weight, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 12 }}>
        <span className="grade-big">{pct !== null ? `${pct.toFixed(1)}%` : "—"}</span>
        {pct !== null && (
          <>
            <span className="pill ok">{letterGrade(pct)}</span>
            <span className="muted">≈ {percentToGpa(pct).toFixed(1)} GPA points</span>
          </>
        )}
        <span className="spacer" />
        <button className="btn primary small" onClick={() => setEditing("new")}>+ Add grade</button>
      </div>

      {totalWeight > 0 && totalWeight !== 100 && (
        <p className="muted" style={{ marginTop: 0 }}>
          Weights add up to {totalWeight}% — the average is normalized, but you may want them to total 100%.
        </p>
      )}

      {cg.length === 0 ? (
        <div className="empty">No grades yet. Add your first score — e.g. "Quiz 1, 18/20, weight 10%".</div>
      ) : (
        <table className="grade-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Score</th>
              <th>%</th>
              <th>Weight</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cg.map((g) => (
              <tr key={g.id}>
                <td>{g.name}</td>
                <td><span className="pill">{g.category || "—"}</span></td>
                <td>{g.score}/{g.outOf}</td>
                <td>{g.outOf > 0 ? ((g.score / g.outOf) * 100).toFixed(1) : "—"}</td>
                <td>{g.weight}%</td>
                <td style={{ textAlign: "right" }}>
                  <button className="icon-btn" onClick={() => setEditing(g)}>✎</button>
                  <button className="icon-btn" onClick={() => dispatch({ type: "deleteGrade", id: g.id })}>🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing !== null && (
        <GradeModal
          courseId={course.id}
          grade={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function GradeModal({ courseId, grade, onClose }: { courseId: string; grade: GradeEntry | null; onClose: () => void }) {
  const dispatch = useDispatch();
  const [name, setName] = useState(grade?.name ?? "");
  const [category, setCategory] = useState(grade?.category ?? "");
  const [score, setScore] = useState(grade?.score ?? 0);
  const [outOf, setOutOf] = useState(grade?.outOf ?? 100);
  const [weight, setWeight] = useState(grade?.weight ?? 10);

  function save() {
    if (!name.trim()) return;
    const g: GradeEntry = {
      id: grade?.id ?? uid(),
      courseId,
      name: name.trim(),
      category: category.trim(),
      score: Number(score) || 0,
      outOf: Number(outOf) || 0,
      weight: Number(weight) || 0,
    };
    dispatch(grade ? { type: "updateGrade", grade: g } : { type: "addGrade", grade: g });
    onClose();
  }

  return (
    <Modal title={grade ? "Edit grade" : "Add grade"} onClose={onClose}>
      <div className="form-cols">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Midterm 1" autoFocus />
        </Field>
        <Field label="Category">
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Exams" />
        </Field>
      </div>
      <div className="form-cols">
        <Field label="Score">
          <input type="number" step="any" value={score} onChange={(e) => setScore(Number(e.target.value))} />
        </Field>
        <Field label="Out of">
          <input type="number" step="any" value={outOf} onChange={(e) => setOutOf(Number(e.target.value))} />
        </Field>
        <Field label="Weight (%)">
          <input type="number" step="any" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
        </Field>
      </div>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={save} disabled={!name.trim()}>
          {grade ? "Save" : "Add"}
        </button>
      </div>
    </Modal>
  );
}
