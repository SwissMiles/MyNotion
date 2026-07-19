import React from "react";
import { MAIN_NAV_ITEMS } from "../../constants";
import { useNavigation } from "../../contexts/NavigationContext";
import { useQuickFind } from "../../contexts/QuickFindContext";
import { useActiveSemester, usePage } from "../../store";

/** Fixed header shown on phone-sized viewports: menu, current view title, search. */
export function MobileTopBar({ onMenu }: { onMenu: () => void }) {
  const quickFind = useQuickFind();

  return (
    <header className="mobile-topbar">
      <button className="topbar-btn" onClick={onMenu} aria-label="Open menu">
        ☰
      </button>
      <span className="topbar-title">
        <ViewTitle />
      </span>
      <button className="topbar-btn" onClick={quickFind.open} aria-label="Search">
        🔍
      </button>
    </header>
  );
}

function ViewTitle() {
  const { view } = useNavigation();
  const { courses } = useActiveSemester();
  const page = usePage(view.kind === "page" ? view.pageId : "");

  if (view.kind === "course") {
    const course = courses.find((c) => c.id === view.courseId);
    return <>{course ? course.name : "Course"}</>;
  }
  if (view.kind === "page") {
    return <>{page ? `${page.icon} ${page.title || "Untitled"}` : "Note"}</>;
  }
  const item = MAIN_NAV_ITEMS.find((i) => i.kind === view.kind);
  return <>{item ? item.label : "MyNotion"}</>;
}
