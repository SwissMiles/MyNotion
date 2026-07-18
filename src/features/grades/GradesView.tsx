import React from "react";
import type { Course } from "../../types";
import { courseGrade, fmtGrade, isPass, roundToQuarter, semesterAverage } from "../../utils/grades";
import { courseLabel } from "../../utils/courses";
import { pluralize } from "../../utils/format";
import { useActiveSemester } from "../../store";
import { useNavigation } from "../../contexts/NavigationContext";
import { ColorDot } from "../../components/ColorDot";

export function GradesView() {
  const { semester, courses, grades } = useActiveSemester();
  if (!semester) return null;

  const courseAverages = courses.map((course) => ({
    course,
    average: courseGrade(grades.filter((g) => g.courseId === course.id)),
    gradeCount: grades.filter((g) => g.courseId === course.id).length,
  }));

  return (
    <div className="page-wrap">
      <h1 className="page-title">📊 Grades</h1>
      <p className="page-sub">
        Swiss scale: 6 is best, 4.0 is a pass. Course grades are rounded to quarter grades; the
        semester average is credit-weighted.
      </p>

      <GradesSummary courseAverages={courseAverages} />

      {courses.length === 0 && (
        <div className="empty">Add courses first — grades live inside each course.</div>
      )}

      {courseAverages.map((entry) => (
        <CourseGradeCard key={entry.course.id} {...entry} />
      ))}
    </div>
  );
}

interface CourseAverage {
  course: Course;
  average: number | null;
  gradeCount: number;
}

function GradesSummary({ courseAverages }: { courseAverages: CourseAverage[] }) {
  const { courses, grades } = useActiveSemester();
  const semesterAvg = semesterAverage(courses, grades);
  const graded = courseAverages.filter((entry) => entry.average !== null);
  const failing = graded.filter((entry) => !isPass(entry.average!));

  return (
    <div className="stat-row stat-row--3">
      <div className="stat">
        <div className="num">{semesterAvg !== null ? semesterAvg.toFixed(2) : "—"}</div>
        <div className="cap">semester average (of 6)</div>
      </div>
      <div className="stat">
        <div className="num">{graded.length}/{courseAverages.length}</div>
        <div className="cap">courses with grades</div>
      </div>
      <div className="stat">
        <div className={`num ${failing.length > 0 ? "text-danger" : ""}`}>
          {graded.length > 0 ? failing.length : "—"}
        </div>
        <div className="cap">below 4.0</div>
      </div>
    </div>
  );
}

function CourseGradeCard({ course, average, gradeCount }: CourseAverage) {
  const { navigate } = useNavigation();

  return (
    <div
      className="card grade-course-card"
      onClick={() => navigate({ kind: "course", courseId: course.id, tab: "grades" })}
    >
      <div className="grade-course-row">
        <ColorDot color={course.color} size="lg" />
        <b>{courseLabel(course)}</b>
        <span className="muted">
          {course.credits} cr · {pluralize(gradeCount, "grade")}
        </span>
        <span className="spacer" />
        {average !== null ? (
          <>
            <span className={`pill ${isPass(average) ? "ok" : "overdue"}`}>
              {isPass(average) ? "pass" : "fail"}
            </span>
            <b>{fmtGrade(roundToQuarter(average))}</b>
          </>
        ) : (
          <span className="muted">no grades yet</span>
        )}
      </div>
    </div>
  );
}
