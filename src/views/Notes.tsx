import React, { useState } from "react";
import { uid, useActiveSemester, useAppState, useDispatch } from "../store";
import type { Page } from "../types";
import type { View } from "../App";
import { BlockEditor } from "../components/BlockEditor";

const PAGE_ICONS = [
  "📄", "📝", "📚", "📖", "🧪", "💡", "🧠", "🗂️",
  "⭐", "🎯", "📌", "🔬", "🧮", "🌍", "🎨", "🎵",
  "💻", "⚗️", "📈", "🏛️", "✏️", "🗓️", "🔖", "🚀",
];

export function newPage(semesterId: string, courseId: string | null, title = ""): Page {
  return {
    id: uid(),
    semesterId,
    courseId,
    title,
    icon: "📄",
    blocks: [],
    updatedAt: new Date().toISOString(),
  };
}

/** List of every note page in the semester, grouped by course. */
export function NotesView({ setView }: { setView: (v: View) => void }) {
  const { semester, pages, courses } = useActiveSemester();
  const dispatch = useDispatch();
  if (!semester) return null;

  const groups: { label: string; color: string | null; pages: Page[] }[] = [
    { label: "General", color: null, pages: pages.filter((p) => p.courseId === null) },
    ...courses.map((c) => ({
      label: c.code || c.name,
      color: c.color,
      pages: pages.filter((p) => p.courseId === c.id),
    })),
  ];

  function createPage() {
    if (!semester) return;
    const page = newPage(semester.id, null);
    dispatch({ type: "addPage", page });
    setView({ kind: "page", pageId: page.id });
  }

  return (
    <div className="page-wrap">
      <h1 className="page-title">📄 All notes</h1>
      <p className="page-sub">Every page in {semester.name}, grouped by course.</p>

      <button className="btn primary" onClick={createPage}>+ New page</button>

      {pages.length === 0 && (
        <div className="empty" style={{ marginTop: 16 }}>
          No pages yet. Create one here, or from inside a course.
        </div>
      )}

      {groups
        .filter((g) => g.pages.length > 0)
        .map((g) => (
          <div key={g.label}>
            <div className="section-title">
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {g.color && <span style={{ width: 10, height: 10, borderRadius: 3, background: g.color }} />}
                {g.label}
              </span>
            </div>
            <div className="card" style={{ padding: 6 }}>
              {g.pages
                .slice()
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .map((p) => (
                  <PageListItem key={p.id} page={p} onOpen={() => setView({ kind: "page", pageId: p.id })} />
                ))}
            </div>
          </div>
        ))}
    </div>
  );
}

export function PageListItem({ page, onOpen }: { page: Page; onOpen: () => void }) {
  const words = page.blocks.reduce((s, b) => s + (b.text ? b.text.trim().split(/\s+/).length : 0), 0);
  return (
    <div className="page-list-item" onClick={onOpen}>
      <span>{page.icon}</span>
      <span>{page.title || "Untitled"}</span>
      <span className="meta">
        {words} words · {new Date(page.updatedAt).toLocaleDateString()}
      </span>
    </div>
  );
}

/** Full-page note editor. */
export function PageView({ pageId, onBack }: { pageId: string; onBack: () => void }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const [showIcons, setShowIcons] = useState(false);
  const page = state.pages.find((p) => p.id === pageId);

  if (!page) {
    return (
      <div className="page-wrap">
        <div className="empty">This page no longer exists.</div>
        <button className="btn" style={{ marginTop: 12 }} onClick={onBack}>← Back</button>
      </div>
    );
  }

  const course = state.courses.find((c) => c.id === page.courseId);

  return (
    <div className="page-wrap note-page">
      <div className="note-toolbar">
        <button className="btn small ghost" onClick={onBack}>← Back</button>
        {course && (
          <span className="pill" style={{ background: course.color, color: "#fff" }}>
            {course.code || course.name}
          </span>
        )}
        <span className="spacer" />
        <span className="muted note-updated">Edited {new Date(page.updatedAt).toLocaleDateString()}</span>
        <button
          className="btn small ghost danger"
          onClick={() => {
            if (confirm(`Delete "${page.title || "Untitled"}"?`)) {
              dispatch({ type: "deletePage", id: page.id });
              onBack();
            }
          }}
        >
          Delete
        </button>
      </div>

      <div className="note-head">
        <button className="note-icon" onClick={() => setShowIcons((v) => !v)} title="Change icon">
          {page.icon}
        </button>
        {showIcons && (
          <div className="icon-picker">
            {PAGE_ICONS.map((ic) => (
              <button
                key={ic}
                className="icon-btn"
                style={{ fontSize: 20 }}
                onClick={() => {
                  dispatch({ type: "updatePageMeta", id: page.id, icon: ic });
                  setShowIcons(false);
                }}
              >
                {ic}
              </button>
            ))}
          </div>
        )}
        <input
          className="page-title-input"
          value={page.title}
          placeholder="Untitled"
          onChange={(e) => dispatch({ type: "updatePageMeta", id: page.id, title: e.target.value })}
        />
      </div>

      <BlockEditor blocks={page.blocks} onChange={(blocks) => dispatch({ type: "setBlocks", pageId: page.id, blocks })} />
    </div>
  );
}
