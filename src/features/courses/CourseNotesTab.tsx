import React from "react";
import type { Course } from "../../types";
import { useActiveSemester, useDispatch } from "../../store";
import { useNavigation } from "../../contexts/NavigationContext";
import { PageListItem } from "../notes/PageListItem";
import { createEmptyPage, sortByRecentlyUpdated } from "../notes/pages";

export function CourseNotesTab({ course }: { course: Course }) {
  const { pages } = useActiveSemester();
  const dispatch = useDispatch();
  const { navigate } = useNavigation();

  const coursePages = pages.filter((p) => p.courseId === course.id);

  function createPage() {
    const page = createEmptyPage(course.semesterId, course.id);
    dispatch({ type: "addPage", page });
    navigate({ kind: "page", pageId: page.id });
  }

  return (
    <div className="tab-panel">
      <button className="btn primary small" onClick={createPage}>+ New page</button>
      <div className="card card--flush">
        {coursePages.length === 0 ? (
          <div className="empty">
            No notes for this course yet — lecture notes, summaries, cheat sheets all go here.
          </div>
        ) : (
          sortByRecentlyUpdated(coursePages).map((page) => (
            <PageListItem
              key={page.id}
              page={page}
              onOpen={() => navigate({ kind: "page", pageId: page.id })}
            />
          ))
        )}
      </div>
    </div>
  );
}
