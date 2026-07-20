import React from "react";
import type { Course, TaskKind } from "../../types";
import { courseShortLabel } from "../../utils/courses";
import type { StatusFilter, TaskFilters } from "./taskFilters";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "done", label: "Done" },
  { value: "all", label: "All" },
];

const KIND_FILTER_OPTIONS: { value: TaskKind | "all"; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "assignment", label: "Assignments" },
  { value: "exam", label: "Exams" },
  { value: "reading", label: "Readings" },
  { value: "project", label: "Projects" },
  { value: "other", label: "Other" },
];

export function TaskFilterBar({
  filters,
  onChange,
  courses,
  onNewTask,
}: {
  filters: TaskFilters;
  onChange: (filters: TaskFilters) => void;
  courses: Course[];
  onNewTask: () => void;
}) {
  return (
    <div className="filter-bar">
      <div className="tabs tabs--bare">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            className={`tab ${filters.status === option.value ? "active" : ""}`}
            onClick={() => onChange({ ...filters, status: option.value })}
          >
            {option.label}
          </button>
        ))}
      </div>
      <span className="spacer" />
      <select
        className="btn small"
        value={filters.kind}
        onChange={(e) => onChange({ ...filters, kind: e.target.value as TaskKind | "all" })}
      >
        {KIND_FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      <select
        className="btn small"
        value={filters.courseId}
        onChange={(e) => onChange({ ...filters, courseId: e.target.value })}
      >
        <option value="all">All courses</option>
        <option value="">Personal</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>{courseShortLabel(course)}</option>
        ))}
      </select>
      <button className="btn primary small" onClick={onNewTask}>+ New task</button>
    </div>
  );
}
