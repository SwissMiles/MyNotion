import React, { useEffect, useState } from "react";
import type { Page } from "../../types";
import { useAppState, useDispatch, usePage } from "../../store";
import { useNavigation } from "../../contexts/NavigationContext";
import { useUndoableDispatch } from "../../contexts/UndoContext";
import { pushRecentPage } from "../../utils/recentPages";
import { CourseTag } from "../../components/CourseTag";
import { BlockEditor } from "../editor/BlockEditor";
import { blocksToMarkdown } from "../editor/markdown";
import { IconPicker } from "./IconPicker";
import { PageLinks } from "./PageLinks";
import { duplicatePage } from "./pages";

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
        currentPageId={page.id}
        onChange={(blocks) => dispatch({ type: "setBlocks", pageId: page.id, blocks })}
      />
      <PageLinks page={page} />
    </div>
  );
}

function PageToolbar({ page }: { page: Page }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const dispatchUndoable = useUndoableDispatch();
  const { goBack, navigate } = useNavigation();
  const course = state.courses.find((c) => c.id === page.courseId);

  function deletePage() {
    dispatchUndoable(`Deleted “${page.title || "Untitled"}”`, { type: "deletePage", id: page.id });
    goBack();
  }

  function duplicate() {
    const copy = duplicatePage(page);
    dispatch({ type: "addPage", page: copy });
    navigate({ kind: "page", pageId: copy.id });
  }

  function exportMarkdown() {
    const blob = new Blob([blocksToMarkdown(page.title, page.blocks)], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(page.title || "untitled").replace(/[\\/:*?"<>|]+/g, "-")}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-view-toolbar">
      <button className="btn small ghost" onClick={goBack}>← Back</button>
      {course && <CourseTag course={course} />}
      <span className="spacer" />
      <button className="btn small ghost" onClick={duplicate} title="Duplicate this page">
        ⧉ Duplicate
      </button>
      <button
        className="btn small ghost"
        onClick={exportMarkdown}
        title="Download this page as Markdown"
      >
        ⬇ Export .md
      </button>
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
