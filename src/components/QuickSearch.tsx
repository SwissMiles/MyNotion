import React, { useMemo, useRef, useState } from "react";
import { useActiveSemester } from "../store";
import { TASK_KIND_ICONS, fmtDate } from "../lib";
import type { View } from "../App";

interface Result {
  id: string;
  icon: string;
  title: string;
  meta: string;
  go: View;
}

/** Short excerpt of `text` centered on the first occurrence of `q`. */
function snippet(text: string, q: string): string {
  const at = text.toLowerCase().indexOf(q);
  const start = Math.max(0, at - 20);
  const cut = text.slice(start, start + 70).trim();
  return (start > 0 ? "…" : "") + cut + (start + 70 < text.length ? "…" : "");
}

export function QuickSearch({ setView, onClose }: { setView: (v: View) => void; onClose: () => void }) {
  const { courses, pages, tasks } = useActiveSemester();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const out: Result[] = [];
    for (const c of courses) {
      if (`${c.code} ${c.name} ${c.instructor}`.toLowerCase().includes(q)) {
        out.push({
          id: `course-${c.id}`,
          icon: "📚",
          title: c.code ? `${c.code} · ${c.name}` : c.name,
          meta: "Course",
          go: { kind: "course", courseId: c.id },
        });
      }
    }
    for (const p of pages) {
      const inTitle = (p.title || "Untitled").toLowerCase().includes(q);
      const block = inTitle ? undefined : p.blocks.find((b) => b.text.toLowerCase().includes(q));
      if (inTitle || block) {
        const course = courses.find((c) => c.id === p.courseId);
        out.push({
          id: `page-${p.id}`,
          icon: p.icon,
          title: p.title || "Untitled",
          meta: block ? snippet(block.text, q) : course ? course.code || course.name : "Note",
          go: { kind: "page", pageId: p.id },
        });
      }
    }
    for (const t of tasks) {
      if (`${t.title} ${t.notes}`.toLowerCase().includes(q)) {
        out.push({
          id: `task-${t.id}`,
          icon: TASK_KIND_ICONS[t.kind],
          title: t.title,
          meta: t.done ? "Done" : `Due ${fmtDate(t.due)}`,
          go: { kind: "tasks" },
        });
      }
    }
    return out.slice(0, 12);
  }, [query, courses, pages, tasks]);

  const idx = Math.min(active, Math.max(0, results.length - 1));

  function open(r: Result) {
    setView(r.go);
    onClose();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(Math.min(idx + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(idx - 1, 0));
    } else if (e.key === "Enter" && results[idx]) {
      e.preventDefault();
      open(results[idx]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  return (
    <div
      className="modal-backdrop"
      style={{ paddingTop: "14vh" }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal quick-search" role="dialog" aria-label="Quick search">
        <input
          autoFocus
          value={query}
          placeholder="Search courses, notes and tasks…"
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKey}
        />
        <div className="qs-results" ref={listRef}>
          {query.trim() !== "" && results.length === 0 && (
            <div className="empty" style={{ border: "none" }}>No matches in this semester.</div>
          )}
          {results.map((r, i) => (
            <button
              key={r.id}
              className={`qs-item ${i === idx ? "active" : ""}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => open(r)}
            >
              <span>{r.icon}</span>
              <span className="qs-title">{r.title}</span>
              <span className="qs-meta">{r.meta}</span>
            </button>
          ))}
          {query.trim() === "" && (
            <div className="qs-hint">Type to search everything in the current semester.</div>
          )}
        </div>
      </div>
    </div>
  );
}
