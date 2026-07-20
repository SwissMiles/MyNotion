import React from "react";
import { MAIN_NAV_ITEMS } from "../../constants";
import { useNavigation } from "../../contexts/NavigationContext";
import { useActiveSemester } from "../../store";
import { openTasks } from "../../utils/tasks";
import { dueCards } from "../../utils/srs";

export function SidebarNav() {
  const { view, navigate } = useNavigation();
  const { tasks, flashcards } = useActiveSemester();
  const openTaskCount = openTasks(tasks).length;
  const dueCardCount = dueCards(flashcards).length;

  return (
    <nav className="nav-section">
      {MAIN_NAV_ITEMS.map((item) => {
        const count =
          item.kind === "tasks" ? openTaskCount : item.kind === "flashcards" ? dueCardCount : 0;
        return (
          <button
            key={item.kind}
            className={`nav-item ${view.kind === item.kind ? "active" : ""}`}
            onClick={() => navigate({ kind: item.kind })}
          >
            <span>{item.icon}</span>
            <span className="label">{item.label}</span>
            {count > 0 && <span className="count">{count}</span>}
          </button>
        );
      })}
    </nav>
  );
}
