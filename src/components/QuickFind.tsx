import React, { useEffect, useMemo, useRef, useState } from "react";
import { uid, useAppState, useDispatch } from "../store";
import type { Course, Page, Semester, Task } from "../types";
import type { View } from "../App";
import { TASK_KIND_ICONS, dueLabel } from "../lib";

/**
 * Quick Find — Notion-style ⌘K / Ctrl+K palette.
 * Searches every page (titles and block content), task, course and semester
 * across ALL semesters, plus navigation and quick actions. Fully
 * keyboard-driven: ↑/↓ to move, Enter to open, Esc to close.
 */

export const IS_MAC = /Mac|iPhone|iPad/.test(
  typeof navigator !== "undefined" ? navigator.platform || navigator.userAgent : "",
);
export const SEARCH_SHORTCUT = IS_MAC ? "⌘K" : "Ctrl K";

/* ---------- recently opened pages (kept outside AppState so backups stay clean) ---------- */

const RECENTS_KEY = "mynotion-recents-v1";

export function pushRecentPage(id: string) {
  try {
    const cur: string[] = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
    const next = [id, ...cur.filter((x) => x !== id)].slice(0, 8);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — recents are a nice-to-have
  }
}

function getRecentPageIds(): string[] {
  try {
    const cur = JSON.parse(localStorage.getItem(RECENTS_KEY) ?? "[]");
    return Array.isArray(cur) ? cur : [];
  } catch {
    return [];
  }
}

/* ---------- matching & highlighting ---------- */

interface Range {
  start: number;
  len: number;
}

function mergeRanges(ranges: Range[]): Range[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const out: Range[] = [];
  for (const r of sorted) {
    const last = out[out.length - 1];
    if (last && r.start <= last.start + last.len) {
      last.len = Math.max(last.len, r.start + r.len - last.start);
    } else {
      out.push({ ...r });
    }
  }
  return out;
}

/** Every query word must appear in the text; earlier / word-start hits score higher. */
function matchText(text: string, words: string[]): { score: number; ranges: Range[] } | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  let score = 0;
  const ranges: Range[] = [];
  for (const w of words) {
    const idx = lower.indexOf(w);
    if (idx === -1) return null;
    if (idx === 0) score += 40;
    else if (!/[\p{L}\p{N}]/u.test(lower[idx - 1])) score += 25; // starts a word
    else score += 8;
    ranges.push({ start: idx, len: w.length });
  }
  if (words.length > 1 && lower.includes(words.join(" "))) score += 15;
  score += Math.max(0, 12 - Math.floor(text.length / 12)); // shorter text ranks a touch higher
  return { score, ranges: mergeRanges(ranges) };
}

/** Trim long matched text to a window around the first hit, shifting highlight ranges. */
function makeSnippet(text: string, ranges: Range[]): { text: string; ranges: Range[] } {
  const MAX = 100;
  if (text.length <= MAX || ranges.length === 0) return { text, ranges };
  let start = Math.max(0, ranges[0].start - 32);
  if (start > 0) {
    const sp = text.indexOf(" ", start);
    if (sp !== -1 && sp < ranges[0].start) start = sp + 1;
  }
  const end = Math.min(text.length, start + MAX);
  const prefix = start > 0 ? "…" : "";
  const sliced = prefix + text.slice(start, end) + (end < text.length ? "…" : "");
  const shifted = ranges
    .filter((r) => r.start >= start && r.start < end)
    .map((r) => ({ start: r.start - start + prefix.length, len: Math.min(r.len, end - r.start) }));
  return { text: sliced, ranges: shifted };
}

function Hi({ text, ranges }: { text: string; ranges?: Range[] }) {
  if (!ranges || ranges.length === 0) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let pos = 0;
  ranges.forEach((r, i) => {
    if (r.start > pos) parts.push(text.slice(pos, r.start));
    parts.push(<mark key={i}>{text.slice(r.start, r.start + r.len)}</mark>);
    pos = r.start + r.len;
  });
  if (pos < text.length) parts.push(text.slice(pos));
  return <>{parts}</>;
}

/* ---------- results ---------- */

interface QFTag {
  label: string;
  color?: string; // course color dot
  tone?: "overdue" | "soon" | "ok";
}

interface QFResult {
  key: string;
  icon: string;
  title: string;
  titleRanges?: Range[];
  snippet?: { text: string; ranges: Range[] };
  tags?: QFTag[];
  score: number;
  run: () => void;
}

interface QFGroup {
  label: string;
  items: QFResult[];
}

const VIEWS: { kind: View["kind"]; icon: string; label: string }[] = [
  { kind: "dashboard", icon: "🏠", label: "Dashboard" },
  { kind: "tasks", icon: "✅", label: "Assignments & Exams" },
  { kind: "timetable", icon: "🗓️", label: "Timetable" },
  { kind: "grades", icon: "📊", label: "Grades" },
  { kind: "notes", icon: "📄", label: "All Notes" },
];

export function QuickFind({
  setView,
  onClose,
  toggleTheme,
  theme,
}: {
  setView: (v: View) => void;
  onClose: () => void;
  toggleTheme: () => void;
  theme: string;
}) {
  const state = useAppState();
  const dispatch = useDispatch();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const semesterById = useMemo(
    () => new Map(state.semesters.map((s) => [s.id, s] as [string, Semester])),
    [state.semesters],
  );
  const courseById = useMemo(
    () => new Map(state.courses.map((c) => [c.id, c] as [string, Course])),
    [state.courses],
  );

  /** Switch semester first when the target lives in another one, then navigate. */
  function open(semesterId: string | null, view: View) {
    if (semesterId && semesterId !== state.activeSemesterId) {
      dispatch({ type: "setActiveSemester", id: semesterId });
    }
    setView(view);
    onClose();
  }

  function pageTags(p: Page): QFTag[] {
    const tags: QFTag[] = [];
    const course = p.courseId ? courseById.get(p.courseId) : null;
    if (course) tags.push({ label: course.code || course.name, color: course.color });
    if (p.semesterId !== state.activeSemesterId) {
      tags.push({ label: semesterById.get(p.semesterId)?.name ?? "?" });
    }
    return tags;
  }

  function pageResult(p: Page, score: number, titleRanges?: Range[], snippet?: QFResult["snippet"]): QFResult {
    return {
      key: `page-${p.id}`,
      icon: p.icon || "📄",
      title: p.title || "Untitled",
      titleRanges,
      snippet,
      tags: pageTags(p),
      score,
      run: () => open(p.semesterId, { kind: "page", pageId: p.id }),
    };
  }

  const groups: QFGroup[] = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const activeBoost = (semesterId: string | null) =>
      semesterId === state.activeSemesterId ? 18 : 0;

    if (words.length === 0) {
      // Empty query: recents, navigation, and the always-available actions.
      const recents = getRecentPageIds()
        .map((id) => state.pages.find((p) => p.id === id))
        .filter((p): p is Page => !!p)
        .slice(0, 6)
        .map((p) => pageResult(p, 0));

      const nav = VIEWS.map<QFResult>((v) => ({
        key: `view-${v.kind}`,
        icon: v.icon,
        title: v.label,
        score: 0,
        run: () => open(null, { kind: v.kind } as View),
      }));

      const actions: QFResult[] = [
        {
          key: "act-newpage",
          icon: "➕",
          title: "New page",
          score: 0,
          run: () => createPage(""),
        },
        {
          key: "act-theme",
          icon: theme === "dark" ? "☀️" : "🌙",
          title: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
          score: 0,
          run: () => {
            toggleTheme();
            onClose();
          },
        },
        ...state.semesters
          .filter((s) => s.id !== state.activeSemesterId)
          .map<QFResult>((s) => ({
            key: `sem-${s.id}`,
            icon: "🎓",
            title: `Switch to ${s.name}`,
            score: 0,
            run: () => open(s.id, { kind: "dashboard" }),
          })),
      ];

      return [
        { label: "Recent pages", items: recents },
        { label: "Go to", items: nav },
        { label: "Actions", items: actions },
      ].filter((g) => g.items.length > 0);
    }

    /* ----- text search across everything ----- */

    const pages: QFResult[] = [];
    for (const p of state.pages) {
      const titleHit = matchText(p.title || "Untitled", words);
      // best content hit for the snippet (and as fallback when the title misses)
      let best: { score: number; snippet: { text: string; ranges: Range[] } } | null = null;
      for (const b of p.blocks) {
        const hit = matchText(b.text, words);
        if (hit && (!best || hit.score > best.score)) {
          best = { score: hit.score, snippet: makeSnippet(b.text, hit.ranges) };
        }
      }
      if (!titleHit && !best) continue;
      const score =
        (titleHit ? 60 + titleHit.score : 20 + (best?.score ?? 0)) + activeBoost(p.semesterId);
      pages.push(pageResult(p, score, titleHit?.ranges, best?.snippet));
    }

    const tasks: QFResult[] = [];
    for (const t of state.tasks) {
      const titleHit = matchText(t.title, words);
      const noteHit = titleHit ? null : matchText(t.notes, words);
      if (!titleHit && !noteHit) continue;
      const course = t.courseId ? courseById.get(t.courseId) : null;
      const due = dueLabel(t.due);
      const tags: QFTag[] = [];
      if (course) tags.push({ label: course.code || course.name, color: course.color });
      if (!t.done) tags.push({ label: due.text, tone: due.tone });
      if (t.semesterId !== state.activeSemesterId) {
        tags.push({ label: semesterById.get(t.semesterId)?.name ?? "?" });
      }
      tasks.push({
        key: `task-${t.id}`,
        icon: t.done ? "☑️" : TASK_KIND_ICONS[t.kind] ?? "📌",
        title: t.title,
        titleRanges: titleHit?.ranges,
        snippet: noteHit ? makeSnippet(t.notes, noteHit.ranges) : undefined,
        tags,
        score: (titleHit ? 40 + titleHit.score : 15 + (noteHit?.score ?? 0)) + activeBoost(t.semesterId),
        run: () =>
          open(
            t.semesterId,
            t.courseId ? { kind: "course", courseId: t.courseId, tab: "tasks" } : { kind: "tasks" },
          ),
      });
    }

    const courses: QFResult[] = [];
    for (const c of state.courses) {
      const label = c.code ? `${c.code} · ${c.name}` : c.name;
      const hit = matchText(label, words) ?? matchText(c.instructor, words);
      if (!hit) continue;
      const tags: QFTag[] = [];
      if (c.semesterId !== state.activeSemesterId) {
        tags.push({ label: semesterById.get(c.semesterId)?.name ?? "?" });
      }
      courses.push({
        key: `course-${c.id}`,
        icon: "📘",
        title: label,
        titleRanges: matchText(label, words)?.ranges,
        snippet: undefined,
        tags: [{ label: "", color: c.color }, ...tags].filter((t) => t.label || t.color),
        score: 45 + hit.score + activeBoost(c.semesterId),
        run: () => open(c.semesterId, { kind: "course", courseId: c.id }),
      });
    }

    const nav: QFResult[] = [];
    for (const v of VIEWS) {
      const hit = matchText(v.label, words);
      if (!hit) continue;
      nav.push({
        key: `view-${v.kind}`,
        icon: v.icon,
        title: v.label,
        titleRanges: hit.ranges,
        score: 25 + hit.score,
        run: () => open(null, { kind: v.kind } as View),
      });
    }

    const semesters: QFResult[] = [];
    for (const s of state.semesters) {
      if (s.id === state.activeSemesterId) continue;
      const hit = matchText(s.name, words);
      if (!hit) continue;
      semesters.push({
        key: `sem-${s.id}`,
        icon: "🎓",
        title: `Switch to ${s.name}`,
        titleRanges: hit.ranges.map((r) => ({ ...r, start: r.start + "Switch to ".length })),
        score: 25 + hit.score,
        run: () => open(s.id, { kind: "dashboard" }),
      });
    }

    const actions: QFResult[] = [];
    const themeHit = matchText(theme === "dark" ? "switch to light mode theme" : "switch to dark mode theme", words);
    if (themeHit) {
      actions.push({
        key: "act-theme",
        icon: theme === "dark" ? "☀️" : "🌙",
        title: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        score: 10 + themeHit.score,
        run: () => {
          toggleTheme();
          onClose();
        },
      });
    }
    // Notion-style: always offer creating a page named after the query.
    actions.push({
      key: "act-newpage",
      icon: "➕",
      title: `New page “${query.trim()}”`,
      score: 1,
      run: () => createPage(query.trim()),
    });

    const byScore = (a: QFResult, b: QFResult) => b.score - a.score;
    return [
      { label: "Pages", items: pages.sort(byScore).slice(0, 8) },
      { label: "Tasks", items: tasks.sort(byScore).slice(0, 6) },
      { label: "Courses", items: courses.sort(byScore).slice(0, 4) },
      { label: "Go to", items: nav },
      { label: "Semesters", items: semesters.slice(0, 4) },
      { label: "Actions", items: actions },
    ].filter((g) => g.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, state, theme]);

  function createPage(title: string) {
    if (!state.activeSemesterId) return;
    const page: Page = {
      id: uid(),
      semesterId: state.activeSemesterId,
      courseId: null,
      title,
      icon: "📄",
      blocks: [],
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: "addPage", page });
    setView({ kind: "page", pageId: page.id });
    onClose();
  }

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const sel = Math.min(selected, Math.max(0, flat.length - 1));

  useEffect(() => setSelected(0), [query]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-idx="${sel}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected(flat.length ? (sel + 1) % flat.length : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected(flat.length ? (sel - 1 + flat.length) % flat.length : 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      flat[sel]?.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  let idx = -1;
  return (
    <div className="qf-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="qf-panel" role="dialog" aria-label="Quick Find">
        <div className="qf-input-row">
          <span className="qf-glass">🔍</span>
          <input
            ref={inputRef}
            className="qf-input"
            value={query}
            placeholder="Search pages, tasks, courses… "
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Search"
          />
          <kbd>esc</kbd>
        </div>
        <div className="qf-results" ref={listRef}>
          {flat.length === 0 && (
            <div className="qf-empty">No results for “{query}”.</div>
          )}
          {groups.map((g) => (
            <div key={g.label}>
              <div className="qf-section">{g.label}</div>
              {g.items.map((r) => {
                idx += 1;
                const i = idx;
                return (
                  <button
                    key={r.key}
                    data-idx={i}
                    className={`qf-item ${i === sel ? "selected" : ""}`}
                    onMouseEnter={() => setSelected(i)}
                    onClick={r.run}
                  >
                    <span className="qf-icon">{r.icon}</span>
                    <span className="qf-main">
                      <span className="qf-title">
                        <Hi text={r.title} ranges={r.titleRanges} />
                      </span>
                      {r.snippet && (
                        <span className="qf-snippet">
                          <Hi text={r.snippet.text} ranges={r.snippet.ranges} />
                        </span>
                      )}
                    </span>
                    {r.tags && r.tags.length > 0 && (
                      <span className="qf-tags">
                        {r.tags.map((t, ti) =>
                          t.color && !t.label ? (
                            <span key={ti} className="dot" style={{ background: t.color, width: 10, height: 10, borderRadius: 3 }} />
                          ) : (
                            <span key={ti} className={`pill ${t.tone ?? ""}`}>
                              {t.color && (
                                <span style={{ width: 8, height: 8, borderRadius: 2, background: t.color }} />
                              )}
                              {t.label}
                            </span>
                          ),
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="qf-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
          <span className="spacer" />
          <span>searches all semesters</span>
        </div>
      </div>
    </div>
  );
}
