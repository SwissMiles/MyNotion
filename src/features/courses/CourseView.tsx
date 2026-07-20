import React, { useState } from "react";
import type { Course } from "../../types";
import { DAY_NAMES } from "../../constants";
import { courseLabel } from "../../utils/courses";
import { pluralize } from "../../utils/format";
import { cssVars } from "../../utils/cssVars";
import { useActiveSemester } from "../../store";
import type { CourseTab } from "../../contexts/NavigationContext";
import { CourseGrades } from "../grades/CourseGrades";
import { CourseModal } from "./CourseModal";
import { CourseNotesTab } from "./CourseNotesTab";
import { CourseTasksTab } from "./CourseTasksTab";
import { CourseInfoTab } from "./CourseInfoTab";

export function CourseView({ courseId, initialTab }: { courseId: string; initialTab?: CourseTab }) {
  const { semester, courses } = useActiveSemester();
  const [activeTab, setActiveTab] = useState<CourseTab>(initialTab ?? "notes");
  const [showEditModal, setShowEditModal] = useState(false);

  const course = courses.find((c) => c.id === courseId);
  if (!course || !semester) {
    return (
      <div className="page-wrap">
        <div className="empty">Course not found in this semester.</div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="course-header-band" style={cssVars({ "--band-color": course.color })} />
      <h1 className="page-title">
        {courseLabel(course)}
        <span className="spacer" />
        <button className="btn small" onClick={() => setShowEditModal(true)}>Edit</button>
      </h1>
      <p className="page-sub">
        {course.instructor ? `${course.instructor} · ` : ""}
        {pluralize(course.credits, "credit")}
        {course.meetings.length > 0 &&
          ` · ${course.meetings.map((m) => `${DAY_NAMES[m.day]} ${m.start}`).join(", ")}`}
      </p>

      <CourseTabs course={course} activeTab={activeTab} onSelect={setActiveTab} />

      {activeTab === "notes" && <CourseNotesTab course={course} />}
      {activeTab === "tasks" && <CourseTasksTab course={course} />}
      {activeTab === "grades" && <CourseGrades course={course} />}
      {activeTab === "info" && <CourseInfoTab course={course} />}

      {showEditModal && (
        <CourseModal semesterId={semester.id} course={course} onClose={() => setShowEditModal(false)} />
      )}
    </div>
  );
}

function CourseTabs({
  course,
  activeTab,
  onSelect,
}: {
  course: Course;
  activeTab: CourseTab;
  onSelect: (tab: CourseTab) => void;
}) {
  const { tasks, pages } = useActiveSemester();
  const noteCount = pages.filter((p) => p.courseId === course.id).length;
  const openTaskCount = tasks.filter((t) => t.courseId === course.id && !t.done).length;

  const tabs: { key: CourseTab; label: string }[] = [
    { key: "notes", label: `Notes (${noteCount})` },
    { key: "tasks", label: `Tasks (${openTaskCount})` },
    { key: "grades", label: "Grades" },
    { key: "info", label: "Info" },
  ];

  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`tab ${activeTab === tab.key ? "active" : ""}`}
          onClick={() => onSelect(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
