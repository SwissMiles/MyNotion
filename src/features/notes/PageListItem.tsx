import React from "react";
import type { Page } from "../../types";
import { pageWordCount } from "./pages";

export function PageListItem({ page, onOpen }: { page: Page; onOpen: () => void }) {
  return (
    <div className="page-list-item" onClick={onOpen}>
      <span>{page.icon}</span>
      <span>{page.title || "Untitled"}</span>
      <span className="meta">
        {pageWordCount(page)} words · {new Date(page.updatedAt).toLocaleDateString()}
      </span>
    </div>
  );
}
