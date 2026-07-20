import React, { useState } from "react";
import { useNavigation } from "../../contexts/NavigationContext";
import { useActiveSemester } from "../../store";
import { courseLabel } from "../../utils/courses";
import { ColorDot } from "../../components/ColorDot";
import { CourseModal } from "../courses/CourseModal";

export function SidebarCourses() {
  const { view, navigate } = useNavigation();
  const { semester, courses } = useActiveSemester();
  const [showCourseModal, setShowCourseModal] = useState(false);

  return (
    <div className="nav-section">
      <div className="nav-label">
        Courses
        <button className="icon-btn" onClick={() => setShowCourseModal(true)} title="Add course">
          +
        </button>
      </div>

      {courses.map((course) => (
        <button
          key={course.id}
          className={`nav-item ${view.kind === "course" && view.courseId === course.id ? "active" : ""}`}
          onClick={() => navigate({ kind: "course", courseId: course.id })}
        >
          <ColorDot color={course.color} />
          <span className="label">{courseLabel(course)}</span>
        </button>
      ))}
      {courses.length === 0 && <div className="muted sidebar-empty">No courses yet — add one!</div>}

      {showCourseModal && semester && (
        <CourseModal semesterId={semester.id} course={null} onClose={() => setShowCourseModal(false)} />
      )}
    </div>
  );
}
