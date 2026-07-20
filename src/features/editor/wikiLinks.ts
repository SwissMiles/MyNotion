import type { Page } from "../../types";

/**
 * Wiki-style links between pages: `[[Page Title]]` in any block links to the
 * page with that title (case-insensitive). Typing `[[` in the editor opens an
 * autocomplete menu of pages; links can also point at pages that don't exist
 * yet — those can be created from the link panels on the page.
 */

/** A page that can be linked to from the editor's `[[` menu. */
export interface LinkTarget {
  id: string;
  title: string;
  icon: string;
}

export type LinkMenuItem =
  | { kind: "page"; target: LinkTarget }
  | { kind: "create"; title: string };

const WIKI_LINK_RE = /\[\[([^[\]\n]+)\]\]/g;

/** All `[[...]]` titles in the text, trimmed, in order of appearance. */
export function extractLinkTitles(text: string): string[] {
  const titles: string[] = [];
  for (const match of text.matchAll(WIKI_LINK_RE)) {
    const title = match[1].trim();
    if (title) titles.push(title);
  }
  return titles;
}

/** Menu entries for the `[[` autocomplete: matching pages, then a
 *  "create page" entry when the query isn't an existing title. */
export function buildLinkMenuItems(targets: LinkTarget[], query: string): LinkMenuItem[] {
  const q = query.trim().toLowerCase();
  const matches = (q === "" ? targets : targets.filter((t) => t.title.toLowerCase().includes(q)))
    .slice()
    .sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.title.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts || a.title.localeCompare(b.title);
    })
    .slice(0, 8);
  const items: LinkMenuItem[] = matches.map((target) => ({ kind: "page", target }));
  const exact = targets.some((t) => t.title.toLowerCase() === q);
  if (q !== "" && !exact) items.push({ kind: "create", title: query.trim() });
  return items;
}

/** Outgoing links of a page: resolved targets and titles with no page yet. */
export function outgoingLinks(
  page: Page,
  pages: Page[],
): { resolved: Page[]; unresolved: string[] } {
  const titles = page.blocks.flatMap((block) => extractLinkTitles(block.text));
  const byTitle = new Map(
    pages.filter((p) => p.id !== page.id && p.title.trim()).map((p) => [p.title.trim().toLowerCase(), p]),
  );
  const resolved: Page[] = [];
  const unresolved: string[] = [];
  const seen = new Set<string>();
  for (const title of titles) {
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const target = byTitle.get(key);
    if (target) resolved.push(target);
    else unresolved.push(title);
  }
  return { resolved, unresolved };
}

/** Pages whose blocks link to `page` by title, with a context snippet. */
export function backlinks(page: Page, pages: Page[]): { page: Page; snippet: string }[] {
  const title = page.title.trim().toLowerCase();
  if (!title) return [];
  const results: { page: Page; snippet: string }[] = [];
  for (const other of pages) {
    if (other.id === page.id) continue;
    const block = other.blocks.find((b) =>
      extractLinkTitles(b.text).some((t) => t.toLowerCase() === title),
    );
    if (block) results.push({ page: other, snippet: snippetAround(block.text, page.title) });
  }
  return results;
}

/** Up to ~100 chars of context around the `[[title]]` mention. */
function snippetAround(text: string, title: string): string {
  const index = text.toLowerCase().indexOf(`[[${title.trim().toLowerCase()}`);
  const start = Math.max(0, index - 30);
  const slice = text.slice(start, start + 110);
  return (start > 0 ? "…" : "") + slice + (start + 110 < text.length ? "…" : "");
}
