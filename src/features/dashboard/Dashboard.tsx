import React from "react";
import { fmtDateLong, weeksUntil } from "../../utils/date";
import { pluralize } from "../../utils/format";
import { useActiveSemester } from "../../store";
import { NoSemesterNotice } from "../../components/NoSemesterNotice";
import { SemesterStats } from "./SemesterStats";
import { StudySection } from "./StudySection";
import { DueSoonSection } from "./DueSoonSection";
import { TodaysClassesSection } from "./TodaysClassesSection";
import { CoursesSection } from "./CoursesSection";

export function Dashboard() {
  const { semester } = useActiveSemester();

  if (!semester) {
    return <NoSemesterNotice message="Create a semester to get started." />;
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
