import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useQuickFind } from "../../contexts/QuickFindContext";
import { SEARCH_SHORTCUT } from "../quick-find/platform";
import { SemesterPicker } from "../semesters/SemesterPicker";
import { SidebarNav } from "./SidebarNav";
import { SidebarCourses } from "./SidebarCourses";
import { BackupControls } from "./BackupControls";

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const quickFind = useQuickFind();

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <span className="logo">🎓</span>
        <span className="name">MyNotion</span>
        <button className="icon-btn" onClick={toggleTheme} title="Toggle theme">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>

      <div className="nav-section nav-section--flat">
        <button className="nav-item" onClick={quickFind.open}>
          <span>🔍</span>
          <span className="label">Search</span>
          <kbd>{SEARCH_SHORTCUT}</kbd>
        </button>
      </div>

      <SemesterPicker />
      <SidebarNav />
      <SidebarCourses />
      <BackupControls />
    </aside>
  );
}
