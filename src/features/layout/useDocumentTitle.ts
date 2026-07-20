import { useEffect } from "react";
import { MAIN_NAV_ITEMS } from "../../constants";
import { useActiveSemester, useAppState } from "../../store";
import { useNavigation } from "../../contexts/NavigationContext";
import { fmtClock, useFocus } from "../../contexts/FocusContext";
import { daysUntil } from "../../utils/date";

/**
 * Single owner of the tab title: the focus countdown while a timer runs,
 * otherwise the current view prefixed with the number of open tasks due
 * today or overdue — visible at a glance even from a background tab.
 */
export function useDocumentTitle(): void {
  const state = useAppState();
  const { tasks } = useActiveSemester();
  const { view } = useNavigation();
  const { running, secondsLeft, phase } = useFocus();

  useEffect(() => {
    if (running) {
      document.title = `${fmtClock(secondsLeft)} ${phase === "focus" ? "⏱" : "☕"} · MyNotion`;
      return;
    }

    let name = "MyNotion";
    if (view.kind === "page") {
      const page = state.pages.find((p) => p.id === view.pageId);
      name = page?.title || "Untitled";
    } else if (view.kind === "course") {
      const course = state.courses.find((c) => c.id === view.courseId);
      name = course?.name ?? "Course";
    } else {
      name = MAIN_NAV_ITEMS.find((item) => item.kind === view.kind)?.label ?? "MyNotion";
    }

    const dueCount = tasks.filter((t) => !t.done && daysUntil(t.due) <= 0).length;
    const badge = dueCount > 0 ? `(${dueCount}) ` : "";
    document.title = `${badge}${name} · MyNotion`;
  }, [state, tasks, view, running, secondsLeft, phase]);
}
