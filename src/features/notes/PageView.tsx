import React, { useEffect, useState } from "react";
import type { Page } from "../../types";
import { useAppState, useDispatch, usePage } from "../../store";
import { useNavigation } from "../../contexts/NavigationContext";
import { pushRecentPage } from "../../utils/recentPages";
import { CourseTag } from "../../components/CourseTag";
import { BlockEditor } from "../editor/BlockEditor";
import { IconPicker } from "./IconPicker";

/** Full-page note editor. */
export function PageView({ pageId }: { pageId: string }) {
  const page = usePage(pageId);
  const { goBack } = useNavigation();

  useEffect(() => {
    pushRecentPage(pageId);
  }, [pageId]);

  if (!page) {
    return (
      <div className="page-wrap">
        <div className="empty">This page no longer exists.</div>
        <div className="back-row">
          <button className="btn" onClick={goBack}>← Back</button>
        </div>
      </div>
    );
  }

  return <PageEditor page={page} />;
}

function PageEditor({ page }: { page: Page }) {
  const dispatch = useDispatch();

  return (
    <div className="page-wrap">
      <PageToolbar page={page} />
      <PageTitleEditor page={page} />
      <BlockEditor
        blocks={page.blocks}
        onChange={(blocks) => dispatch({ type: "setBlocks", pageId: page.id, blocks })}
      />
    </div>
  );
}

function PageToolbar({ page }: { page: Page }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const { goBack } = useNavigation();
  const course = state.courses.find((c) => c.id === page.courseId);

  function deletePage() {
    if (confirm(`Delete "${page.title || "Untitled"}"?`)) {
      dispatch({ type: "deletePage", id: page.id });
      goBack();
    }
  }

  return (
    <div className="page-view-toolbar">
      <button className="btn small ghost" onClick={goBack}>← Back</button>
      {course && <CourseTag course={course} />}
      <span className="spacer" />
      <button className="btn small ghost danger" onClick={deletePage}>
        Delete page
      </button>
    </div>
  );
}

function PageTitleEditor({ page }: { page: Page }) {
  const dispatch = useDispatch();
  const [showIconPicker, setShowIconPicker] = useState(false);

  return (
    <div className="page-title-block">
      <h1 className="page-title page-title--editable">
        <button
          className="icon-btn page-icon-button"
          onClick={() => setShowIconPicker((open) => !open)}
          title="Change icon"
        >
          {page.icon}
        </button>
        <input
          className="page-title-input"
          value={page.title}
          placeholder="Untitled"
          onChange={(e) => dispatch({ type: "updatePageMeta", id: page.id, title: e.target.value })}
        />
      </h1>
      {showIconPicker && (
        <IconPicker
          onPick={(icon) => {
            dispatch({ type: "updatePageMeta", id: page.id, icon });
            setShowIconPicker(false);
          }}
        />
      )}
    </div>
  );
}
