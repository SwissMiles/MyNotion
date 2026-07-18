import React from "react";
import { dateRangeProgress, daysUntil } from "../../utils/date";
import { openTasks, sortByDue } from "../../utils/tasks";
import { semesterAverage } from "../../utils/grades";
import { cssVars } from "../../utils/cssVars";
import { useActiveSemester } from "../../store";

export function SemesterStats() {
  const { semester, courses, tasks, grades } = useActiveSemester();
  if (!semester) return null;

  const open = openTasks(tasks);
  const nextExam = sortByDue(open.filter((t) => t.kind === "exam" && daysUntil(t.due) >= 0))[0];
  const average = semesterAverage(courses, grades);
  const progress = dateRangeProgress(semester.startDate, semester.endDate);

  return (
    <div className="stat-row">
      <div className="stat">
        <div className="num">{open.length}</div>
        <div className="cap">open tasks</div>
      </div>
      <div className="stat">
        <div className="num">{nextExam ? `${daysUntil(nextExam.due)}d` : "—"}</div>
        <div className="cap">{nextExam ? `until ${nextExam.title}` : "no exams scheduled"}</div>
      </div>
      <div className="stat">
        <div className="num">{average !== null ? average.toFixed(2) : "—"}</div>
        <div className="cap">average grade (of 6)</div>
      </div>
      <div className="stat">
        <div className="num">{Math.round(progress)}%</div>
        <div className="cap">of semester done</div>
        <div className="progress-track">
          <div className="progress-fill" style={cssVars({ "--progress": `${progress}%` })} />
        </div>
      </div>
    </div>
  );
}
