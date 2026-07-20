import React from "react";
import type { Page } from "../../types";
import { useAppState, useDispatch } from "../../store";
import { useNavigation } from "../../contexts/NavigationContext";
import { backlinks, outgoingLinks } from "../editor/wikiLinks";
import { createEmptyPage } from "./pages";

/**
 * The link panels under a note: pages this page links to via `[[...]]`
 * (with one-click creation of pages that don't exist yet), and "Linked
 * mentions" — every page that links back here, with a context snippet.
 */
export function PageLinks({ page }: { page: Page }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const { navigate } = useNavigation();

  const semesterPages = state.pages.filter((p) => p.semesterId === page.semesterId);
  const { resolved, unresolved } = outgoingLinks(page, semesterPages);
  const mentions = backlinks(page, semesterPages);

  if (resolved.length === 0 && unresolved.length === 0 && mentions.length === 0) return null;

  function createAndOpen(title: string) {
    const created = createEmptyPage(page.semesterId, page.courseId, title);
    dispatch({ type: "addPage", page: created });
    navigate({ kind: "page", pageId: created.id });
  }

  return (
    <div className="page-links">
      {(resolved.length > 0 || unresolved.length > 0) && (
        <div className="page-links-section">
          <div className="page-links-label">Links on this page</div>
          <div className="link-chips">
            {resolved.map((target) => (
              <button
                key={target.id}
                className="link-chip"
                onClick={() => navigate({ kind: "page", pageId: target.id })}
              >
                {target.icon} {target.title}
              </button>
            ))}
            {unresolved.map((title) => (
              <button
                key={title}
                className="link-chip link-chip--missing"
                title="This page doesn't exist yet — click to create it"
                onClick={() => createAndOpen(title)}
              >
                ＋ {title}
              </button>
            ))}
          </div>
        </div>
      )}

      {mentions.length > 0 && (
        <div className="page-links-section">
          <div className="page-links-label">Linked mentions</div>
          {mentions.map(({ page: source, snippet }) => (
            <button
              key={source.id}
              className="backlink-item"
              onClick={() => navigate({ kind: "page", pageId: source.id })}
            >
              <span className="backlink-title">
                {source.icon} {source.title || "Untitled"}
              </span>
              <span className="backlink-snippet">{snippet}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
