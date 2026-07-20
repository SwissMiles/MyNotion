import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useQuickFind } from "../../contexts/QuickFindContext";
import { SEARCH_SHORTCUT } from "../quick-find/platform";
import { SemesterPicker } from "../semesters/SemesterPicker";
import { FocusIndicator } from "./FocusIndicator";
import { SidebarNav } from "./SidebarNav";
import { SidebarCourses } from "./SidebarCourses";
import { BackupControls } from "./BackupControls";

export function Sidebar({
  open = false,
  onClose,
  account = null,
}: {
  /** On mobile the sidebar is an off-canvas drawer; this slides it in. */
  open?: boolean;
  onClose?: () => void;
  /** Signed-in account button (Clerk) when auth is configured. */
  account?: React.ReactNode;
}) {
  const { setting, cycleTheme } = useTheme();
  const quickFind = useQuickFind();

  const themeIcon = setting === "light" ? "☀️" : setting === "dark" ? "🌙" : "🌓";
  const themeLabel = setting === "system" ? "matches your device" : setting;

  return (
    <aside className={`sidebar ${open ? "sidebar--open" : ""}`}>
      <div className="sidebar-head">
        <span className="logo">🎓</span>
        <span className="name">MyNotion</span>
        <button
          className="icon-btn"
          onClick={cycleTheme}
          title={`Theme: ${themeLabel} — click to change`}
        >
          {themeIcon}
        </button>
        {account && <span className="sidebar-account">{account}</span>}
        {onClose && (
          <button className="icon-btn sidebar-close" onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        )}
      </div>

      <div className="nav-section nav-section--flat">
        <button className="nav-item" onClick={quickFind.open}>
          <span>🔍</span>
          <span className="label">Search</span>
          <kbd>{SEARCH_SHORTCUT}</kbd>
        </button>
      </div>

      <FocusIndicator />
      <SemesterPicker />
      <SidebarNav />
      <SidebarCourses />
      <BackupControls />
    </aside>
  );
}
