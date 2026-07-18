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

export function sortByRecentlyUpdated(pages: Page[]): Page[] {
  return [...pages].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function pageWordCount(page: Page): number {
  return page.blocks.reduce(
    (sum, block) => sum + (block.text ? block.text.trim().split(/\s+/).length : 0),
    0,
  );
}
