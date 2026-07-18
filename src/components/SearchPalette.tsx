import React, { useEffect, useMemo, useRef, useState } from "react";
import { useActiveSemester } from "../store";
import { TASK_KIND_ICONS, fmtDate } from "../lib";
import type { View } from "../App";

type Result = {
  key: string;
  icon: string;
  label: string;
  sub: string;
  go: () => void;
};

export function SearchPalette({ setView, onClose }: { setView: (v: View) => void; onClose: () => void }) {
  const { courses, pages, tasks } = useActiveSemester();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo<Result[]>(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const out: Result[] = [];
    const matches = (s: string) => s.toLowerCase().includes(needle);

    for (const c of courses) {
      if (matches(c.name) || matches(c.code) || matches(c.instructor)) {
        out.push({
          key: `c-${c.id}`,
          icon: "📚",
          label: c.code ? `${c.code} · ${c.name}` : c.name,
          sub: c.instructor || "Course",
          go: () => setView({ kind: "course", courseId: c.id }),
        });
      }
    }
    for (const p of pages) {
      const inTitle = matches(p.title);
      const block = inTitle ? undefined : p.blocks.find((b) => matches(b.text));
      if (inTitle || block) {
        const course = courses.find((c) => c.id === p.courseId);
        out.push({
          key: `p-${p.id}`,
          icon: p.icon,
          label: p.title || "Untitled",
          sub: block ? `…${block.text.slice(0, 60)}` : course ? course.code || course.name : "Note",
          go: () => setView({ kind: "page", pageId: p.id }),
        });
      }
    }
    for (const t of tasks) {
      if (matches(t.title) || matches(t.notes)) {
        out.push({
          key: `t-${t.id}`,
          icon: TASK_KIND_ICONS[t.kind],
          label: t.title,
          sub: t.done ? "Done" : `Due ${fmtDate(t.due)}`,
          go: () =>
            t.courseId
              ? setView({ kind: "course", courseId: t.courseId, tab: "tasks" })
              : setView({ kind: "tasks" }),
        });
      }
    }
    return out.slice(0, 12);
  }, [q, courses, pages, tasks, setView]);

  useEffect(() => setSel(0), [q]);

  useEffect(() => {
    listRef.current?.querySelector(".sel")?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  function pick(r: Result) {
    r.go();
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[sel]) {
      e.preventDefault();
      pick(results[sel]);
    }
  }

  return (
    <div className="modal-backdrop palette-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-label="Search" onKeyDown={onKeyDown}>
        <input
          className="palette-input"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses, notes and tasks…"
          autoFocus
          enterKeyHint="go"
        />
        <div className="palette-results" ref={listRef}>
          {q.trim() === "" ? (
            <div className="palette-empty">Type to search everything in this semester.</div>
          ) : results.length === 0 ? (
            <div className="palette-empty">No matches for “{q.trim()}”.</div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.key}
                className={`palette-item ${i === sel ? "sel" : ""}`}
                onMouseEnter={() => setSel(i)}
                onClick={() => pick(r)}
              >
                <span className="p-icon">{r.icon}</span>
                <span className="p-label">{r.label}</span>
                <span className="p-sub">{r.sub}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
