import React, { useEffect, useRef } from "react";
import type { Block, BlockType } from "../../types";
import { SlashMenu } from "./SlashMenu";
import type { SlashItem } from "./slashMenu";

const PLACEHOLDERS: Record<Exclude<BlockType, "divider">, string> = {
  h1: "Heading 1",
  h2: "Heading 2",
  todo: "To-do",
  bullet: "List item",
  code: "Code",
  quote: "Quote",
  text: "Type '/' for commands…",
};

export function BlockRow({
  block,
  autoFocus,
  onFocusDone,
  onText,
  onKey,
  onToggle,
  onRemove,
  slashItems,
  slashSelected,
  onSlashHover,
  onSlashPick,
  onSlashClose,
}: {
  block: Block;
  autoFocus: boolean;
  onFocusDone: () => void;
  onText: (text: string, caret: number) => void;
  onKey: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onToggle: () => void;
  onRemove: () => void;
  slashItems: SlashItem[] | null; // null = menu closed for this block
  slashSelected: number;
  onSlashHover: (index: number) => void;
  onSlashPick: (index: number) => void;
  onSlashClose: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      onFocusDone();
    }
  }, [autoFocus, onFocusDone]);

  useAutoGrow(textareaRef, block);

  if (block.type === "divider") {
    return (
      <div className="block">
        <span className="handle" onClick={onRemove} title="Remove divider">✕</span>
        <hr className="block-divider" />
      </div>
    );
  }

  return (
    <div className={`block ${block.type}`}>
      <span className="handle" title="Block">⋮⋮</span>
      {block.type === "todo" && (
        <input type="checkbox" checked={!!block.checked} onChange={onToggle} />
      )}
      {block.type === "bullet" && <span className="bullet-mark">•</span>}
      <textarea
        ref={textareaRef}
        rows={1}
        className={`block-input ${block.type === "todo" && block.checked ? "checked-text" : ""}`}
        value={block.text}
        placeholder={PLACEHOLDERS[block.type]}
        onChange={(e) => onText(e.target.value, e.target.selectionStart ?? e.target.value.length)}
        onKeyDown={onKey}
        onBlur={onSlashClose}
      />
      {slashItems && (
        <SlashMenu
          items={slashItems}
          selected={slashSelected}
          onHover={onSlashHover}
          onPick={onSlashPick}
        />
      )}
    </div>
  );
}

/** Grows the textarea to fit its content whenever the text changes. */
function useAutoGrow(ref: React.RefObject<HTMLTextAreaElement>, block: Block) {
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [ref, block.text, block.type]);
}
