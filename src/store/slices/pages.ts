import type { AppState, Block, ID, Page } from "../../types";

export type PagesAction =
  | { type: "addPage"; page: Page }
  | { type: "updatePageMeta"; id: ID; title?: string; icon?: string }
  | { type: "setBlocks"; pageId: ID; blocks: Block[] }
  | { type: "deletePage"; id: ID };

export function pagesReducer(state: AppState, action: PagesAction): AppState {
  switch (action.type) {
    case "addPage":
      return { ...state, pages: [...state.pages, action.page] };
    case "updatePageMeta":
      return updatePage(state, action.id, (page) => ({
        ...page,
        title: action.title ?? page.title,
        icon: action.icon ?? page.icon,
      }));
    case "setBlocks":
      return updatePage(state, action.pageId, (page) => ({ ...page, blocks: action.blocks }));
    case "deletePage":
      return { ...state, pages: state.pages.filter((p) => p.id !== action.id) };
  }
}

/** Applies a change to one page and stamps its updatedAt. */
function updatePage(state: AppState, pageId: ID, change: (page: Page) => Page): AppState {
  return {
    ...state,
    pages: state.pages.map((p) =>
      p.id === pageId ? { ...change(p), updatedAt: new Date().toISOString() } : p,
    ),
  };
}
