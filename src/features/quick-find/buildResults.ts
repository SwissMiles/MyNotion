import type { AppState, Course, Page, Semester } from "../../types";
import type { Theme } from "../../contexts/ThemeContext";
import { MAIN_NAV_ITEMS, TASK_KIND_ICONS } from "../../constants";
import { courseLabel } from "../../utils/courses";
import { dueLabel } from "../../utils/tasks";
import { getRecentPageIds } from "../../utils/recentPages";
import { matchText, makeSnippet, type MatchRange, type Snippet } from "./search";
import type { QuickFindGroup, QuickFindResult, ResultTag } from "./types";

/**
 * Builds the Quick Find result groups for a query. Pure: takes state in,
 * returns declarative results whose actions are interpreted by the palette.
 * Searches every page (titles and block content), task, course and semester
 * across ALL semesters, plus navigation and quick actions.
 */
export function buildQuickFindGroups(query: string, state: AppState, theme: Theme): QuickFindGroup[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const ctx: SearchContext = {
    words,
    state,
    courseById: new Map(state.courses.map((c) => [c.id, c])),
    semesterById: new Map(state.semesters.map((s) => [s.id, s])),
  };

  if (words.length === 0) return emptyQueryGroups(ctx, theme);

  const byScore = (a: QuickFindResult, b: QuickFindResult) => b.score - a.score;
  const groups: QuickFindGroup[] = [
    { label: "Pages", items: searchPages(ctx).sort(byScore).slice(0, 8) },
    { label: "Tasks", items: searchTasks(ctx).sort(byScore).slice(0, 6) },
    { label: "Courses", items: searchCourses(ctx).sort(byScore).slice(0, 4) },
    { label: "Go to", items: searchViews(ctx) },
    { label: "Semesters", items: searchSemesters(ctx).slice(0, 4) },
    { label: "Actions", items: searchActions(ctx, theme, query) },
  ];
  return groups.filter((g) => g.items.length > 0);
}

interface SearchContext {
  words: string[];
  state: AppState;
  courseById: Map<string, Course>;
  semesterById: Map<string, Semester>;
}

/** Results in the active semester rank a bit higher. */
function activeBoost(ctx: SearchContext, semesterId: string | null): number {
  return semesterId === ctx.state.activeSemesterId ? 18 : 0;
}

/** Tag naming the semester, only when the item lives outside the active one. */
function semesterTag(ctx: SearchContext, semesterId: string): ResultTag[] {
  if (semesterId === ctx.state.activeSemesterId) return [];
  return [{ label: ctx.semesterById.get(semesterId)?.name ?? "?" }];
}

/* ---------- empty query: recents, navigation, actions ---------- */

function emptyQueryGroups(ctx: SearchContext, theme: Theme): QuickFindGroup[] {
  const recents = getRecentPageIds()
    .map((id) => ctx.state.pages.find((p) => p.id === id))
    .filter((p): p is Page => !!p)
    .slice(0, 6)
    .map((p) => pageResult(ctx, p, 0));

  const nav = MAIN_NAV_ITEMS.map<QuickFindResult>((item) => ({
    key: `view-${item.kind}`,
    icon: item.icon,
    title: item.label,
    score: 0,
    action: { type: "navigate", semesterId: null, view: { kind: item.kind } },
  }));

  const actions: QuickFindResult[] = [
    { key: "act-newpage", icon: "➕", title: "New page", score: 0, action: { type: "create-page", title: "" } },
    themeToggleResult(theme, 0),
    ...ctx.state.semesters
      .filter((s) => s.id !== ctx.state.activeSemesterId)
      .map((s) => semesterResult(s, 0)),
  ];

  return [
    { label: "Recent pages", items: recents },
    { label: "Go to", items: nav },
    { label: "Actions", items: actions },
  ].filter((g) => g.items.length > 0);
}

/* ---------- per-domain searches ---------- */

function pageResult(
  ctx: SearchContext,
  page: Page,
  score: number,
  titleRanges?: MatchRange[],
  snippet?: Snippet,
): QuickFindResult {
  const course = page.courseId ? ctx.courseById.get(page.courseId) : null;
  const tags: ResultTag[] = [
    ...(course ? [{ label: course.code || course.name, color: course.color }] : []),
    ...semesterTag(ctx, page.semesterId),
  ];
  return {
    key: `page-${page.id}`,
    icon: page.icon || "📄",
    title: page.title || "Untitled",
    titleRanges,
    snippet,
    tags,
    score,
    action: { type: "navigate", semesterId: page.semesterId, view: { kind: "page", pageId: page.id } },
  };
}

function searchPages(ctx: SearchContext): QuickFindResult[] {
  const results: QuickFindResult[] = [];
  for (const page of ctx.state.pages) {
    const titleHit = matchText(page.title || "Untitled", ctx.words);
    // best content hit for the snippet (and as fallback when the title misses)
    let best: { score: number; snippet: Snippet } | null = null;
    for (const block of page.blocks) {
      const hit = matchText(block.text, ctx.words);
      if (hit && (!best || hit.score > best.score)) {
        best = { score: hit.score, snippet: makeSnippet(block.text, hit.ranges) };
      }
    }
    if (!titleHit && !best) continue;
    const score =
      (titleHit ? 60 + titleHit.score : 20 + (best?.score ?? 0)) + activeBoost(ctx, page.semesterId);
    results.push(pageResult(ctx, page, score, titleHit?.ranges, best?.snippet));
  }
  return results;
}

function searchTasks(ctx: SearchContext): QuickFindResult[] {
  const results: QuickFindResult[] = [];
  for (const task of ctx.state.tasks) {
    const titleHit = matchText(task.title, ctx.words);
    const noteHit = titleHit ? null : matchText(task.notes, ctx.words);
    if (!titleHit && !noteHit) continue;

    const course = task.courseId ? ctx.courseById.get(task.courseId) : null;
    const due = dueLabel(task.due);
    const tags: ResultTag[] = [
      ...(course ? [{ label: course.code || course.name, color: course.color }] : []),
      ...(!task.done ? [{ label: due.text, tone: due.tone }] : []),
      ...semesterTag(ctx, task.semesterId),
    ];

    results.push({
      key: `task-${task.id}`,
      icon: task.done ? "☑️" : TASK_KIND_ICONS[task.kind],
      title: task.title,
      titleRanges: titleHit?.ranges,
      snippet: noteHit ? makeSnippet(task.notes, noteHit.ranges) : undefined,
      tags,
      score:
        (titleHit ? 40 + titleHit.score : 15 + (noteHit?.score ?? 0)) +
        activeBoost(ctx, task.semesterId),
      action: {
        type: "navigate",
        semesterId: task.semesterId,
        view: task.courseId
          ? { kind: "course", courseId: task.courseId, tab: "tasks" }
          : { kind: "tasks" },
      },
    });
  }
  return results;
}

function searchCourses(ctx: SearchContext): QuickFindResult[] {
  const results: QuickFindResult[] = [];
  for (const course of ctx.state.courses) {
    const label = courseLabel(course);
    const hit = matchText(label, ctx.words) ?? matchText(course.instructor, ctx.words);
    if (!hit) continue;
    results.push({
      key: `course-${course.id}`,
      icon: "📘",
      title: label,
      titleRanges: matchText(label, ctx.words)?.ranges,
      tags: [{ label: "", color: course.color }, ...semesterTag(ctx, course.semesterId)],
      score: 45 + hit.score + activeBoost(ctx, course.semesterId),
      action: {
        type: "navigate",
        semesterId: course.semesterId,
        view: { kind: "course", courseId: course.id },
      },
    });
  }
  return results;
}

function searchViews(ctx: SearchContext): QuickFindResult[] {
  const results: QuickFindResult[] = [];
  for (const item of MAIN_NAV_ITEMS) {
    const hit = matchText(item.label, ctx.words);
    if (!hit) continue;
    results.push({
      key: `view-${item.kind}`,
      icon: item.icon,
      title: item.label,
      titleRanges: hit.ranges,
      score: 25 + hit.score,
      action: { type: "navigate", semesterId: null, view: { kind: item.kind } },
    });
  }
  return results;
}

function semesterResult(semester: Semester, score: number, ranges?: MatchRange[]): QuickFindResult {
  return {
    key: `sem-${semester.id}`,
    icon: "🎓",
    title: `Switch to ${semester.name}`,
    titleRanges: ranges?.map((r) => ({ ...r, start: r.start + "Switch to ".length })),
    score,
    action: { type: "navigate", semesterId: semester.id, view: { kind: "dashboard" } },
  };
}

function searchSemesters(ctx: SearchContext): QuickFindResult[] {
  const results: QuickFindResult[] = [];
  for (const semester of ctx.state.semesters) {
    if (semester.id === ctx.state.activeSemesterId) continue;
    const hit = matchText(semester.name, ctx.words);
    if (!hit) continue;
    results.push(semesterResult(semester, 25 + hit.score, hit.ranges));
  }
  return results;
}

function themeToggleResult(theme: Theme, score: number): QuickFindResult {
  return {
    key: "act-theme",
    icon: theme === "dark" ? "☀️" : "🌙",
    title: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
    score,
    action: { type: "toggle-theme" },
  };
}

function searchActions(ctx: SearchContext, theme: Theme, query: string): QuickFindResult[] {
  const results: QuickFindResult[] = [];
  const themeHit = matchText(
    theme === "dark" ? "switch to light mode theme" : "switch to dark mode theme",
    ctx.words,
  );
  if (themeHit) results.push(themeToggleResult(theme, 10 + themeHit.score));

  // Notion-style: always offer creating a page named after the query.
  results.push({
    key: "act-newpage",
    icon: "➕",
    title: `New page “${query.trim()}”`,
    score: 1,
    action: { type: "create-page", title: query.trim() },
  });
  return results;
}
