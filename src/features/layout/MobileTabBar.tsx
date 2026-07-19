import React from "react";
import { MAIN_NAV_ITEMS } from "../../constants";
import type { StaticViewKind } from "../../contexts/NavigationContext";
import { useNavigation } from "../../contexts/NavigationContext";
import { useActiveSemester } from "../../store";
import { openTasks } from "../../utils/tasks";

/** Compact labels that fit under the icons in the bottom tab bar. */
const TAB_LABELS: Record<StaticViewKind, string> = {
  dashboard: "Home",
  tasks: "Tasks",
  timetable: "Timetable",
  grades: "Grades",
  notes: "Notes",
};

/** Fixed bottom navigation shown on phone-sized viewports. */
export function MobileTabBar() {
  const { view, navigate } = useNavigation();
  const { tasks } = useActiveSemester();
  const openTaskCount = openTasks(tasks).length;

  return (
    <nav className="mobile-tabbar" aria-label="Main navigation">
      {MAIN_NAV_ITEMS.map((item) => (
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
