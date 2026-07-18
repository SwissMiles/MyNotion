import React from "react";
import { useActiveSemester } from "../../store";
import { useNavigation } from "../../contexts/NavigationContext";
import { ColorDot } from "../../components/ColorDot";

export function CoursesSection() {
  const { courses } = useActiveSemester();
  const { navigate } = useNavigation();

  return (
    <div>
      <div className="section-title">📚 Courses</div>
      <div className="card card--flush">
        {courses.length === 0 && <div className="empty">Add your courses from the sidebar.</div>}
        {courses.map((course) => (
          <div
            key={course.id}
            className="task-row task-row--link"
            onClick={() => navigate({ kind: "course", courseId: course.id })}
          >
            <ColorDot color={course.color} />
            <span className="title">{course.name}</span>
            <span className="muted">{course.credits} cr</span>
          </div>
        ))}
      </div>
    </div>
  );
}
