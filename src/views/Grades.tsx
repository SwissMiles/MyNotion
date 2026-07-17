import React, { useState } from "react";
import { uid, useActiveSemester, useDispatch } from "../store";
import { courseGrade, fmtGrade, isPass, pointsToGrade, roundToQuarter, semesterAverage } from "../lib";
import type { Course, GradeEntry } from "../types";
import { Field, Modal } from "../components/ui";
import type { View } from "../App";

export function GradesView({ setView }: { setView: (v: View) => void }) {
  const { semester, courses, grades } = useActiveSemester();
  if (!semester) return null;

  const avg = semesterAverage(courses, grades);
  const courseAvgs = courses.map((c) => ({
    course: c,
    avg: courseGrade(grades.filter((g) => g.courseId === c.id)),
  }));
  const graded = courseAvgs.filter((x) => x.avg !== null);
  const failing = graded.filter((x) => !isPass(x.avg!));

  return (
    <div className="page-wrap">
      <h1 className="page-title">📊 Grades</h1>
      <p className="page-sub">Swiss scale: 6 is best, 4.0 is a pass. Course grades are rounded to quarter grades; the semester average is credit-weighted.</p>

      <div className="stat-row" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat">
          <div className="num">{avg !== null ? avg.toFixed(2) : "—"}</div>
          <div className="cap">semester average (of 6)</div>
        </div>
        <div className="stat">
          <div className="num">{graded.length}/{courses.length}</div>
          <div className="cap">courses with grades</div>
        </div>
        <div className="stat">
          <div className="num" style={failing.length > 0 ? { color: "var(--danger)" } : undefined}>
            {graded.length > 0 ? failing.length : "—"}
          </div>
          <div className="cap">below 4.0</div>
        </div>
      </div>

      {courses.length === 0 && <div className="empty">Add courses first — grades live inside each course.</div>}

      {courseAvgs.map(({ course: c, avg: courseAvg }) => {
        const count = grades.filter((g) => g.courseId === c.id).length;
        return (
          <div key={c.id} className="card" style={{ marginTop: 14, cursor: "pointer" }} onClick={() => setView({ kind: "course", courseId: c.id, tab: "grades" })}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 12, height: 12, borderRadius: 4, background: c.color }} />
              <b>{c.code ? `${c.code} · ` : ""}{c.name}</b>
              <span className="muted">{c.credits} cr · {count} grade{count === 1 ? "" : "s"}</span>
              <span className="spacer" />
              {courseAvg !== null ? (
                <>
                  <span className={`pill ${isPass(courseAvg) ? "ok" : "overdue"}`}>
                    {isPass(courseAvg) ? "pass" : "fail"}
                  </span>
                  <b>{fmtGrade(roundToQuarter(courseAvg))}</b>
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
  const avg = courseGrade(cg);
  const totalWeight = cg.reduce((s, g) => s + g.weight, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 12 }}>
        <span className="grade-big" style={avg !== null && !isPass(avg) ? { color: "var(--danger)" } : undefined}>
          {avg !== null ? fmtGrade(roundToQuarter(avg)) : "—"}
        </span>
        {avg !== null && (
          <>
            <span className={`pill ${isPass(avg) ? "ok" : "overdue"}`}>{isPass(avg) ? "pass" : "fail"}</span>
            <span className="muted">exact average {avg.toFixed(2)} · rounded to quarter grades</span>
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
        <div className="empty">No grades yet. Add your first one — e.g. "Quiz 1, grade 5.5, weight 10%".</div>
      ) : (
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
            {cg.map((g) => (
              <tr key={g.id}>
                <td>{g.name}</td>
                <td><span className="pill">{g.category || "—"}</span></td>
                <td style={g.grade < 4 ? { color: "var(--danger)", fontWeight: 600 } : { fontWeight: 600 }}>
                  {fmtGrade(g.grade)}
                </td>
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
  const [gradeValue, setGradeValue] = useState<string>(grade ? fmtGrade(grade.grade) : "");
  const [weight, setWeight] = useState(grade?.weight ?? 10);
  const [score, setScore] = useState<string>("");
  const [outOf, setOutOf] = useState<string>("");

  const parsed = Number(gradeValue.replace(",", "."));
  const valid = !isNaN(parsed) && parsed >= 1 && parsed <= 6;

  function applyPoints(s: string, o: string) {
    setScore(s);
    setOutOf(o);
    const sn = Number(s.replace(",", "."));
    const on = Number(o.replace(",", "."));
    if (!isNaN(sn) && !isNaN(on) && on > 0) {
      setGradeValue(fmtGrade(roundToQuarter(pointsToGrade(sn, on))));
    }
  }

  function save() {
    if (!name.trim() || !valid) return;
    const g: GradeEntry = {
      id: grade?.id ?? uid(),
      courseId,
      name: name.trim(),
      category: category.trim(),
      grade: parsed,
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
        <Field label="Grade (1–6)">
          <input
            type="number"
            step="0.25"
            min={1}
            max={6}
            value={gradeValue}
            onChange={(e) => setGradeValue(e.target.value)}
            placeholder="4.75"
          />
        </Field>
        <Field label="Weight (%)">
          <input type="number" step="any" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
        </Field>
      </div>
      <Field label="…or compute from points (5 · points ⁄ max + 1, quarter-rounded)">
        <div className="form-cols">
          <input type="number" step="any" placeholder="Points" value={score} onChange={(e) => applyPoints(e.target.value, outOf)} />
          <input type="number" step="any" placeholder="Max points" value={outOf} onChange={(e) => applyPoints(score, e.target.value)} />
        </div>
      </Field>
      {gradeValue !== "" && !valid && <p className="muted" style={{ color: "var(--danger)" }}>Grade must be between 1 and 6.</p>}
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn primary" onClick={save} disabled={!name.trim() || !valid}>
          {grade ? "Save" : "Add"}
        </button>
      </div>
    </Modal>
  );
}
