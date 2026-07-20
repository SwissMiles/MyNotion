import type { Page } from "../../types";
import { uid } from "../../utils/id";

export function createEmptyPage(semesterId: string, courseId: string | null, title = ""): Page {
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

/** A copy of the page with fresh ids (blocks included) ready to insert. */
export function duplicatePage(page: Page): Page {
  return {
    ...page,
    id: uid(),
    title: `${page.title || "Untitled"} (copy)`,
    blocks: page.blocks.map((block) => ({ ...block, id: uid() })),
    updatedAt: new Date().toISOString(),
  };
}

export function sortByRecentlyUpdated(pages: Page[]): Page[] {
  return [...pages].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function pageWordCount(page: Page): number {
  return page.blocks.reduce(
    (sum, block) => sum + (block.text ? block.text.trim().split(/\s+/).length : 0),
    0,
  );
}
