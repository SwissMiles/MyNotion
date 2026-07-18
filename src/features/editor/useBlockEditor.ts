import { useMemo, useRef, type KeyboardEvent } from "react";
import type { Block, BlockType } from "../../types";
import { createBlock } from "./blocks";
import { matchMarkdownShortcut } from "./markdownShortcuts";

/**
 * All block-list editing behavior for the editor: markdown conversions,
 * Enter/Backspace handling, list continuation and block reordering.
 * The component only renders; this hook owns the operations.
 */
export function useBlockEditor(blocks: Block[], onChange: (blocks: Block[]) => void) {
  // Which block should grab focus after the next render (e.g. a freshly
  // inserted one). A ref, not state: it must not trigger renders itself.
  const pendingFocusId = useRef<string | null>(null);

  // Always present at least one block to type into; memoized so the
  // placeholder block keeps a stable id across renders.
  const emptyFallback = useMemo(() => [createBlock()], []);
  const list = blocks.length > 0 ? blocks : emptyFallback;

  function update(id: string, patch: Partial<Block>) {
    onChange(list.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function insertAfter(index: number, type: BlockType = "text") {
    const block = createBlock(type);
    pendingFocusId.current = block.id;
    onChange([...list.slice(0, index + 1), block, ...list.slice(index + 1)]);
  }

  function remove(index: number) {
    if (list.length === 1) {
      onChange([{ ...list[0], type: "text", text: "" }]);
      return;
    }
    const neighbor = list[index - 1] ?? list[index + 1];
    pendingFocusId.current = neighbor?.id ?? null;
    onChange(list.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    pendingFocusId.current = next[target].id;
    onChange(next);
  }

  function handleTextChange(block: Block, index: number, raw: string) {
    const shortcut = block.type === "text" ? matchMarkdownShortcut(raw) : null;
    if (shortcut?.kind === "convert") {
      update(block.id, { type: shortcut.type, text: shortcut.text });
      return;
    }
    if (shortcut?.kind === "divider") {
      const converted = list.map((b, i) =>
        i === index ? { ...b, type: "divider" as BlockType, text: "" } : b,
      );
      const follower = createBlock();
      onChange([...converted.slice(0, index + 1), follower, ...converted.slice(index + 1)]);
      return;
    }
    update(block.id, { text: raw });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>, block: Block, index: number) {
    if (event.key === "Enter" && !event.shiftKey && block.type !== "code") {
      event.preventDefault();
      // continue lists: new bullet/todo after a non-empty one, exit after an empty one
      if ((block.type === "bullet" || block.type === "todo") && block.text === "") {
        update(block.id, { type: "text" });
      } else {
        insertAfter(index, block.type === "bullet" || block.type === "todo" ? block.type : "text");
      }
    } else if (event.key === "Backspace" && block.text === "") {
      event.preventDefault();
      if (block.type !== "text") update(block.id, { type: "text" });
      else remove(index);
    } else if ((event.altKey || event.metaKey) && event.key === "ArrowUp") {
      event.preventDefault();
      move(index, -1);
    } else if ((event.altKey || event.metaKey) && event.key === "ArrowDown") {
      event.preventDefault();
      move(index, 1);
    }
  }

  return {
    list,
    pendingFocusId,
    toggleChecked: (block: Block) => update(block.id, { checked: !block.checked }),
    remove,
    handleTextChange,
    handleKeyDown,
  };
}
