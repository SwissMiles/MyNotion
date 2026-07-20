import React, { useState } from "react";
import type { Course, GradeEntry } from "../../types";
import { courseGrade, fmtGrade, isPass, roundToQuarter } from "../../utils/grades";
import { useActiveSemester } from "../../store";
import { GradeTable } from "./GradeTable";
import { GradeModal } from "./GradeModal";
import { TargetHint } from "./TargetHint";

/** Grade table for a single course (used inside CourseView). */
export function CourseGrades({ course }: { course: Course }) {
  const { grades } = useActiveSemester();
  const [gradeModal, setGradeModal] = useState<{ grade: GradeEntry | null } | null>(null);

  const courseGrades = grades.filter((g) => g.courseId === course.id);
  const average = courseGrade(courseGrades);
  const totalWeight = courseGrades.reduce((sum, g) => sum + g.weight, 0);

  return (
    <div>
      <div className="grade-summary-row">
        <span className={`grade-big ${average !== null && !isPass(average) ? "text-danger" : ""}`}>
          {average !== null ? fmtGrade(roundToQuarter(average)) : "—"}
        </span>
        {average !== null && (
          <>
            <span className={`pill ${isPass(average) ? "ok" : "overdue"}`}>
              {isPass(average) ? "pass" : "fail"}
            </span>
            <span className="muted">exact average {average.toFixed(2)} · rounded to quarter grades</span>
          </>
        )}
        <span className="spacer" />
        <button className="btn primary small" onClick={() => setGradeModal({ grade: null })}>
          + Add grade
        </button>
      </div>

      {totalWeight > 0 && totalWeight !== 100 && (
        <p className="muted weight-warning">
          Weights add up to {totalWeight}% — the average is normalized, but you may want them to
          total 100%.
        </p>
      )}

      {courseGrades.length > 0 && totalWeight < 100 && <TargetHint grades={courseGrades} />}

      {courseGrades.length === 0 ? (
        <div className="empty">
          No grades yet. Add your first one — e.g. "Quiz 1, grade 5.5, weight 10%".
        </div>
      ) : (
        <GradeTable grades={courseGrades} onEdit={(grade) => setGradeModal({ grade })} />
      )}

      {gradeModal && (
        <GradeModal courseId={course.id} grade={gradeModal.grade} onClose={() => setGradeModal(null)} />
      )}
    </div>
  );
}
