import React from "react";
import { useNavigation } from "./contexts/NavigationContext";
import { Dashboard } from "./features/dashboard/Dashboard";
import { TasksView } from "./features/tasks/TasksView";
import { CalendarView } from "./features/calendar/CalendarView";
import { FlashcardsView } from "./features/flashcards/FlashcardsView";
import { FocusView } from "./features/focus/FocusView";
import { TimetableView } from "./features/timetable/TimetableView";
import { GradesView } from "./features/grades/GradesView";
import { NotesView } from "./features/notes/NotesView";
import { PageView } from "./features/notes/PageView";
import { CourseView } from "./features/courses/CourseView";

/** Renders the view the navigation context currently points at. */
export function ActiveView() {
  const { view } = useNavigation();

  switch (view.kind) {
    case "tasks":
      return <TasksView />;
    case "calendar":
      return <CalendarView />;
    case "flashcards":
      return <FlashcardsView />;
    case "focus":
      return <FocusView />;
    case "timetable":
      return <TimetableView />;
    case "grades":
      return <GradesView />;
    case "notes":
      return <NotesView />;
    case "course":
      // Keyed so navigating between courses/tabs resets the tab state.
      return (
        <CourseView
          key={view.courseId + (view.tab ?? "")}
          courseId={view.courseId}
          initialTab={view.tab}
        />
      );
    case "page":
      return <PageView key={view.pageId} pageId={view.pageId} />;
    case "dashboard":
      return <Dashboard />;
  }
}
