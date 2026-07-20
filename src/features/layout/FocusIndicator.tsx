import React from "react";
import { fmtClock, useFocus } from "../../contexts/FocusContext";
import { useNavigation } from "../../contexts/NavigationContext";
import { useActiveSemester } from "../../store";
import { courseShortLabel } from "../../utils/courses";

/** Sidebar chip showing the running focus/break timer; click jumps to Focus. */
export function FocusIndicator() {
  const focus = useFocus();
  const { view, navigate } = useNavigation();
  const { courses } = useActiveSemester();

  if (!focus.active || view.kind === "focus") return null;

  const course = focus.courseId ? courses.find((c) => c.id === focus.courseId) : null;
  const label =
    focus.phase === "break" ? "Break" : course ? courseShortLabel(course) : "Focusing";

  return (
    <div className="nav-section">
      <button
        className={`nav-item focus-indicator ${focus.running ? "" : "focus-indicator--paused"}`}
        onClick={() => navigate({ kind: "focus" })}
        title="Go to Focus"
      >
        <span>{focus.phase === "break" ? "☕" : "⏱️"}</span>
        <span className="label">{label}</span>
        <span className="focus-indicator-time">
          {focus.running ? fmtClock(focus.secondsLeft) : "paused"}
        </span>
      </button>
    </div>
  );
}
