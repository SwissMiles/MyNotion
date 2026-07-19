import React from "react";
import { fmtDateLong, weeksUntil } from "../../utils/date";
import { pluralize } from "../../utils/format";
import { useActiveSemester } from "../../store";
import { SemesterStats } from "./SemesterStats";
import { DueSoonSection } from "./DueSoonSection";
import { TodaysClassesSection } from "./TodaysClassesSection";
import { StudySection } from "./StudySection";
import { CoursesSection } from "./CoursesSection";

export function Dashboard() {
  const { semester } = useActiveSemester();

  if (!semester) {
    return (
      <div className="page-wrap">
        <div className="empty">Create a semester to get started.</div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <h1 className="page-title">🏠 {semester.name}</h1>
      <p className="page-sub">
        {fmtDateLong(new Date().toISOString())} · {pluralize(weeksUntil(semester.endDate), "week")} left
        in the semester
      </p>

      <SemesterStats />

      <div className="grid-2">
        <DueSoonSection />
        <div>
          <TodaysClassesSection />
          <StudySection />
          <CoursesSection />
        </div>
      </div>
    </div>
  );
}
