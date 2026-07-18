import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppState, useDispatch } from "../store";
import type { Page, Task } from "../types";
import type { View } from "../App";

type Result =
  | { kind: "page"; id: string; icon: string; title: string; context: string; snippet: string; semesterId: string }
  | { kind: "task"; id: string; icon: string; title: string; context: string; snippet: string; semesterId: string };

const MAX_RESULTS = 20;

function makeSnippet(text: string, q: string): string {
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return "";
  const start = Math.max(0, i - 30);
  const end = Math.min(text.length, i + q.length + 50);
  return `${start > 0 ? "…" : ""}${text.slice(start, end)}${end < text.length ? "…" : ""}`;
}

/** Full-text search across every page and task in every semester. */
export function SearchModal({ onClose, setView }: { onClose: () => void; setView: (v: View) => void }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const semesterName = useMemo(() => {
    const map = new Map(state.semesters.map((s) => [s.id, s.name]));
    return (id: string) => map.get(id) ?? "";
  }, [state.semesters]);

  const courseLabel = useMemo(() => {
    const map = new Map(state.courses.map((c) => [c.id, c.code || c.name]));
    return (id: string | null) => (id ? map.get(id) ?? "" : "");
  }, [state.courses]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const out: Result[] = [];

    for (const p of state.pages) {
      let snippet = "";
      if (p.title.toLowerCase().includes(q)) snippet = "";
      else {
        const hit = p.blocks.find((b) => b.text.toLowerCase().includes(q));
        if (!hit) continue;
        snippet = makeSnippet(hit.text, q);
      }
      out.push({
        kind: "page",
        id: p.id,
        icon: p.icon,
        title: p.title || "Untitled",
        context: [courseLabel(p.courseId), semesterName(p.semesterId)].filter(Boolean).join(" · "),
        snippet,
        semesterId: p.semesterId,
      });
      if (out.length >= MAX_RESULTS) return out;
    }

    for (const t of state.tasks) {
      const inTitle = t.title.toLowerCase().includes(q);
      const inNotes = t.notes.toLowerCase().includes(q);
      if (!inTitle && !inNotes) continue;
      out.push({
        kind: "task",
        id: t.id,
        icon: t.kind === "exam" ? "📝" : "✅",
        title: t.title,
        context: [courseLabel(t.courseId), semesterName(t.semesterId)].filter(Boolean).join(" · "),
        snippet: inNotes ? makeSnippet(t.notes, q) : "",
        semesterId: t.semesterId,
      });
      if (out.length >= MAX_RESULTS) break;
    }
    return out;
  }, [query, state, courseLabel, semesterName]);

  useEffect(() => setSelected(0), [query]);

  function open(r: Result) {
    if (r.semesterId !== state.activeSemesterId) dispatch({ type: "setActiveSemester", id: r.semesterId });
    setView(r.kind === "page" ? { kind: "page", pageId: r.id } : { kind: "tasks" });
    onClose();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      open(results[selected]);
    }
  }

  return (
    <div className="modal-backdrop search-backdrop" onMouseDown={onClose}>
      <div className="search-panel" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKey}>
        <input
          ref={inputRef}
          className="search-input"
          placeholder="Search notes and tasks…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="search-results">
          {query.trim().length >= 2 && results.length === 0 && (
            <div className="muted" style={{ padding: "14px 16px" }}>No matches for “{query.trim()}”.</div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.kind}-${r.id}`}
              className={`search-result ${i === selected ? "selected" : ""}`}
              onMouseEnter={() => setSelected(i)}
              onClick={() => open(r)}
            >
              <span className="icon">{r.icon}</span>
              <span className="body">
                <span className="title">{r.title}</span>
                {r.snippet && <span className="snippet">{r.snippet}</span>}
              </span>
              {r.context && <span className="context">{r.context}</span>}
            </button>
          ))}
        </div>
        <div className="search-hint">↑↓ navigate · Enter open · Esc close</div>
      </div>
    </div>
  );
}
