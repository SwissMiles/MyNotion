import React from "react";
import { MAIN_NAV_ITEMS, MOBILE_TAB_KINDS } from "../../constants";
import type { StaticViewKind } from "../../contexts/NavigationContext";
import { useNavigation } from "../../contexts/NavigationContext";
import { useActiveSemester } from "../../store";
import { openTasks } from "../../utils/tasks";

/** Compact labels that fit under the icons in the bottom tab bar. */
const TAB_LABELS: Record<StaticViewKind, string> = {
  dashboard: "Home",
  tasks: "Tasks",
  calendar: "Calendar",
  timetable: "Timetable",
  flashcards: "Cards",
  focus: "Focus",
  grades: "Grades",
  notes: "Notes",
};

/** Only the core views fit in the bar; the rest live in the drawer sidebar. */
const TAB_ITEMS = MAIN_NAV_ITEMS.filter((item) => MOBILE_TAB_KINDS.includes(item.kind));

/** Fixed bottom navigation shown on phone-sized viewports. */
export function MobileTabBar() {
  const { view, navigate } = useNavigation();
  const { tasks } = useActiveSemester();
  const openTaskCount = openTasks(tasks).length;

  return (
    <nav className="mobile-tabbar" aria-label="Main navigation">
      {TAB_ITEMS.map((item) => (
        <button
          key={item.kind}
          className={`tabbar-item ${view.kind === item.kind ? "active" : ""}`}
          onClick={() => navigate({ kind: item.kind })}
        >
          <span className="tabbar-icon">
            {item.icon}
            {item.kind === "tasks" && openTaskCount > 0 && (
              <span className="tabbar-badge">{openTaskCount > 99 ? "99+" : openTaskCount}</span>
            )}
          </span>
          <span className="tabbar-label">{TAB_LABELS[item.kind]}</span>
        </button>
      ))}
    </nav>
  );
}
