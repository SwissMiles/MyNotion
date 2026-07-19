import React, { useEffect, useRef } from "react";
import type { SlashItem } from "./slashMenu";

/**
 * The dropdown shown under a block while a "/" command is being typed.
 * Not focusable itself — the textarea keeps focus and forwards ↑/↓/↵/esc;
 * mousedown is prevented so clicking an item doesn't blur the block.
 */
export function SlashMenu({
  items,
  selected,
  onHover,
  onPick,
}: {
  items: SlashItem[];
  selected: number;
  onHover: (index: number) => void;
  onPick: (index: number) => void;
}) {
  const selectedRef = useRef<HTMLButtonElement>(null);

  // The menu scrolls; keep the keyboard-highlighted item visible.
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <div className="slash-menu" onMouseDown={(e) => e.preventDefault()}>
      <div className="slash-section">Blocks</div>
      {items.map((item, index) => (
        <button
          key={item.type}
          ref={index === selected ? selectedRef : null}
          className={`slash-item ${index === selected ? "selected" : ""}`}
          onMouseEnter={() => onHover(index)}
          onClick={() => onPick(index)}
        >
          <span className="slash-icon">{item.icon}</span>
          <span className="slash-main">
            <span className="slash-title">{item.title}</span>
            <span className="slash-desc">{item.description}</span>
          </span>
        </button>
      ))}
      <div className="slash-foot">
        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span><kbd>↵</kbd> select</span>
        <span><kbd>esc</kbd> dismiss</span>
      </div>
    </div>
  );
}
