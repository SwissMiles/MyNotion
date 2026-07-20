import React from "react";
import type { Course } from "../types";
import { courseShortLabel } from "../utils/courses";
import { cssVars } from "../utils/cssVars";

/** A compact colored chip naming a course. */
export function CourseTag({ course }: { course: Course }) {
  return (
    <span className="course-tag" style={cssVars({ "--tag-color": course.color })}>
      {courseShortLabel(course)}
    </span>
  );
}
