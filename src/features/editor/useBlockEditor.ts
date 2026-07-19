import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Block, BlockType } from "../../types";
import { createBlock } from "./blocks";
import { matchMarkdownShortcut } from "./markdownShortcuts";
import { filterSlashItems, type SlashItem } from "./slashMenu";

/** Open "/" command menu: which block it's anchored to, where the query
 *  starts (index right after the slash), what's been typed, and which
 *  item is highlighted. */
interface SlashState {
  blockId: string;
  anchor: number;
  query: string;
  selected: number;
}

/**
 * All block-list editing behavior for the editor: markdown conversions,
 * the "/" command menu, Enter/Backspace handling, list continuation and
 * block reordering. The component only renders; this hook owns the operations.
 */
export function useBlockEditor(blocks: Block[], onChange: (blocks: Block[]) => void) {
  // Which block should grab focus after the next render (e.g. a freshly
  // inserted one). A ref, not state: it must not trigger renders itself.
  const pendingFocusId = useRef<string | null>(null);

  const [slash, setSlash] = useState<SlashState | null>(null);
  const slashItems = useMemo(() => (slash ? filterSlashItems(slash.query) : []), [slash]);

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

  /** Turn `block` into a divider, moving any leftover text to a follower
   *  block that receives focus (same behavior as typing "---"). */
  function convertToDivider(index: number, leftoverText: string) {
    const converted = list.map((b, i) =>
      i === index ? { ...b, type: "divider" as BlockType, text: "" } : b,
    );
    const follower = { ...createBlock(), text: leftoverText };
    pendingFocusId.current = follower.id;
    onChange([...converted.slice(0, index + 1), follower, ...converted.slice(index + 1)]);
  }

  /** Track the "/" menu as the block's text changes: open it when a slash
   *  is typed, keep the query in sync, close it when the slash is deleted,
   *  the caret leaves the query, or nothing matches anymore. */
  function trackSlash(block: Block, raw: string, caret: number) {
    if (slash && slash.blockId === block.id) {
      const slashGone = raw[slash.anchor - 1] !== "/";
      if (slashGone || caret < slash.anchor) {
        setSlash(null);
        return;
      }
      const query = raw.slice(slash.anchor, caret);
      if (filterSlashItems(query).length === 0) {
        setSlash(null);
        return;
      }
      if (query !== slash.query) setSlash({ ...slash, query, selected: 0 });
      return;
    }
    // Open on a freshly typed "/" (single-character insertion). Code blocks
    // are exempt — slashes are everyday characters there.
    const typedSlash =
      block.type !== "code" && raw.length === block.text.length + 1 && raw[caret - 1] === "/";
    if (typedSlash) setSlash({ blockId: block.id, anchor: caret, query: "", selected: 0 });
  }

  /** Apply the picked menu item: strip "/query" from the text, then convert
   *  the block (or drop in a divider). */
  function applySlashItem(item: SlashItem, block: Block, index: number) {
    if (!slash) return;
    const text = block.text.slice(0, slash.anchor - 1) + block.text.slice(slash.anchor + slash.query.length);
    setSlash(null);
    if (item.type === "divider") convertToDivider(index, text);
    else update(block.id, { type: item.type, text });
  }

  function handleTextChange(block: Block, index: number, raw: string, caret: number) {
    const shortcut = block.type === "text" ? matchMarkdownShortcut(raw) : null;
    if (shortcut?.kind === "convert") {
      setSlash(null);
      update(block.id, { type: shortcut.type, text: shortcut.text });
      return;
    }
    if (shortcut?.kind === "divider") {
      setSlash(null);
      convertToDivider(index, "");
      return;
    }
    trackSlash(block, raw, caret);
    update(block.id, { text: raw });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>, block: Block, index: number) {
    if (slash && slash.blockId === block.id) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        const count = slashItems.length;
        setSlash({ ...slash, selected: (slash.selected + step + count) % count });
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        applySlashItem(slashItems[slash.selected], block, index);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setSlash(null);
        return;
      }
    }
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
    slash,
    slashItems,
    setSlashSelected: (selected: number) => slash && setSlash({ ...slash, selected }),
    pickSlashItem: (itemIndex: number, block: Block, index: number) =>
      applySlashItem(slashItems[itemIndex], block, index),
    closeSlash: () => setSlash(null),
    toggleChecked: (block: Block) => update(block.id, { checked: !block.checked }),
    remove,
    handleTextChange,
    handleKeyDown,
  };
}
