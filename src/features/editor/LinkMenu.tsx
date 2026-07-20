import React, { useEffect, useRef } from "react";
import type { LinkMenuItem } from "./wikiLinks";

/**
 * The dropdown shown under a block while a "[[" page link is being typed.
 * Same interaction model as the SlashMenu: the textarea keeps focus and
 * forwards ↑/↓/↵/esc; mousedown is prevented so clicks don't blur the block.
 */
export function LinkMenu({
  items,
  selected,
  onHover,
  onPick,
}: {
  items: LinkMenuItem[];
  selected: number;
  onHover: (index: number) => void;
  onPick: (index: number) => void;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <div className="slash-menu" onMouseDown={(e) => e.preventDefault()}>
      <div className="slash-section">Link to page</div>
      {items.map((item, index) => (
        <button
          key={item.kind === "page" ? item.target.id : "create"}
          ref={index === selected ? selectedRef : null}
          className={`slash-item ${index === selected ? "selected" : ""}`}
          onMouseEnter={() => onHover(index)}
          onClick={() => onPick(index)}
        >
          <span className="slash-icon">{item.kind === "page" ? item.target.icon : "＋"}</span>
          <span className="slash-main">
            <span className="slash-title">
              {item.kind === "page" ? item.target.title : `Create “${item.title}”`}
            </span>
            <span className="slash-desc">
              {item.kind === "page" ? "Link to this page" : "New page, linked from here"}
            </span>
          </span>
        </button>
      ))}
      <div className="slash-foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span><kbd>↵</kbd> link</span>
        <span><kbd>esc</kbd> dismiss</span>
      </div>
    </div>
  );
}
