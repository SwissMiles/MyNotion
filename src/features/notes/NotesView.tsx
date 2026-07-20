import React from "react";
import type { Course, Page } from "../../types";
import { courseShortLabel } from "../../utils/courses";
import { useActiveSemester, useDispatch } from "../../store";
import { useNavigation } from "../../contexts/NavigationContext";
import { ColorDot } from "../../components/ColorDot";
import { NoSemesterNotice } from "../../components/NoSemesterNotice";
import { PageListItem } from "./PageListItem";
import { createEmptyPage, sortByRecentlyUpdated } from "./pages";

interface PageGroup {
  key: string;
  label: string;
  color: string | null;
  pages: Page[];
}

function groupPagesByCourse(pages: Page[], courses: Course[]): PageGroup[] {
  const groups: PageGroup[] = [
    { key: "general", label: "General", color: null, pages: pages.filter((p) => p.courseId === null) },
    ...courses.map((course) => ({
      key: course.id,
      label: courseShortLabel(course),
      color: course.color,
      pages: pages.filter((p) => p.courseId === course.id),
    })),
  ];
  return groups.filter((group) => group.pages.length > 0);
}

/** Every note page in the semester, grouped by course. */
export function NotesView() {
  const { semester, pages, courses } = useActiveSemester();
  const dispatch = useDispatch();
  const { navigate } = useNavigation();

  if (!semester) {
    return <NoSemesterNotice message="Create a semester to start taking notes." />;
  }

  function createPage() {
    if (!semester) return;
    const page = createEmptyPage(semester.id, null);
    dispatch({ type: "addPage", page });
    navigate({ kind: "page", pageId: page.id });
  }

  return (
    <div className="page-wrap">
      <h1 className="page-title">📄 All notes</h1>
      <p className="page-sub">Every page in {semester.name}, grouped by course.</p>

      <button className="btn primary" onClick={createPage}>+ New page</button>

      {pages.length === 0 && (
        <div className="empty empty--spaced">No pages yet. Create one here, or from inside a course.</div>
      )}

      {groupPagesByCourse(pages, courses).map((group) => (
        <div key={group.key}>
          <div className="section-title">
            <span className="section-title-label">
              {group.color && <ColorDot color={group.color} />}
              {group.label}
            </span>
          </div>
          <div className="card card--flush">
            {sortByRecentlyUpdated(group.pages).map((page) => (
              <PageListItem
                key={page.id}
                page={page}
                onOpen={() => navigate({ kind: "page", pageId: page.id })}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
