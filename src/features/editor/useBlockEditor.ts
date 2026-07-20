import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Block, BlockType } from "../../types";
import { createBlock } from "./blocks";
import { matchMarkdownShortcut } from "./markdownShortcuts";
import { filterSlashItems, type SlashItem } from "./slashMenu";
import { buildLinkMenuItems, type LinkMenuItem, type LinkTarget } from "./wikiLinks";

export const MAX_INDENT = 4;

/** Open "/" command menu: which block it's anchored to, where the query
 *  starts (index right after the slash), what's been typed, and which
 *  item is highlighted. */
interface SlashState {
  blockId: string;
  anchor: number;
  query: string;
  selected: number;
}

/** Open "[[" page-link menu; anchor is the index right after the brackets. */
interface LinkState {
  blockId: string;
  anchor: number;
  query: string;
  selected: number;
}

/** Which block should grab focus after the next render, and where the
 *  caret goes (end of text when omitted). */
export interface PendingFocus {
  id: string;
  caret?: number;
}

export function isListType(type: BlockType): boolean {
  return type === "bullet" || type === "todo" || type === "numbered";
}

/** Block types that have no editable textarea. */
export function isNonText(type: BlockType): boolean {
  return type === "divider" || type === "image";
}

/**
 * All block-list editing behavior for the editor: markdown conversions,
 * the "/" command menu, Enter/Backspace handling (split & merge at the
 * caret), list continuation, indenting and block reordering. The component
 * only renders; this hook owns the operations.
 */
export function useBlockEditor(
  blocks: Block[],
  onChange: (blocks: Block[]) => void,
  /** Pages offered by the "[[" wiki-link autocomplete. */
  linkTargets: LinkTarget[] = [],
  /** Called when the user picks "create page" in the link menu. */
  onCreateLinkedPage?: (title: string) => void,
) {
  // A ref, not state: it must not trigger renders itself.
  const pendingFocus = useRef<PendingFocus | null>(null);

  const [slash, setSlash] = useState<SlashState | null>(null);
  const slashItems = useMemo(() => (slash ? filterSlashItems(slash.query) : []), [slash]);

  const [link, setLink] = useState<LinkState | null>(null);
  const linkItems = useMemo(
    () => (link ? buildLinkMenuItems(linkTargets, link.query) : []),
    [link, linkTargets],
  );

  // Always present at least one block to type into; memoized so the
  // placeholder block keeps a stable id across renders.
  const emptyFallback = useMemo(() => [createBlock()], []);
  const list = blocks.length > 0 ? blocks : emptyFallback;

  function update(id: string, patch: Partial<Block>) {
    onChange(list.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function insertAfter(index: number, type: BlockType = "text") {
    const block = createBlock(type);
    pendingFocus.current = { id: block.id };
    onChange([...list.slice(0, index + 1), block, ...list.slice(index + 1)]);
  }

  /** Insert an image block (used by the paste handler). */
  function insertImageAfter(index: number, url: string) {
    const block: Block = { ...createBlock("image"), url };
    onChange([...list.slice(0, index + 1), block, ...list.slice(index + 1)]);
  }

  function remove(index: number) {
    if (list.length === 1) {
      onChange([{ ...list[0], type: "text", text: "", checked: false, indent: 0, url: undefined }]);
      return;
    }
    const neighbor = list[index - 1] ?? list[index + 1];
    pendingFocus.current = neighbor && !isNonText(neighbor.type) ? { id: neighbor.id } : null;
    onChange(list.filter((_, i) => i !== index));
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];
    if (!isNonText(next[target].type)) pendingFocus.current = { id: next[target].id };
    onChange(next);
  }

  /** Move the block at `from` so it sits at position `to` (drag & drop). */
  function reorder(from: number, to: number) {
    if (to === from || to === from + 1) return;
    const next = [...list];
    const [moving] = next.splice(from, 1);
    next.splice(to > from ? to - 1 : to, 0, moving);
    onChange(next);
  }

  function duplicate(index: number) {
    const copy: Block = { ...list[index], id: createBlock().id };
    if (!isNonText(copy.type)) pendingFocus.current = { id: copy.id };
    onChange([...list.slice(0, index + 1), copy, ...list.slice(index + 1)]);
  }

  /** Turn `block` into a divider, moving any leftover text to a follower
   *  block that receives focus (same behavior as typing "---"). */
  function convertToDivider(index: number, leftoverText: string) {
    const converted = list.map((b, i) =>
      i === index ? { ...b, type: "divider" as BlockType, text: "" } : b,
    );
    const follower = { ...createBlock(), text: leftoverText };
    pendingFocus.current = { id: follower.id, caret: 0 };
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
    // image blocks have no textarea to focus — the picker takes over
    else update(block.id, { type: item.type, text });
  }

  /** Track the "[[" link menu as text changes: open on a freshly typed
   *  second bracket, keep the query in sync, close when the brackets are
   *  edited away or the caret leaves the query. */
  function trackLink(block: Block, raw: string, caret: number) {
    if (link && link.blockId === block.id) {
      const bracketsGone = raw.slice(link.anchor - 2, link.anchor) !== "[[";
      if (bracketsGone || caret < link.anchor) {
        setLink(null);
        return;
      }
      const query = raw.slice(link.anchor, caret);
      if (query.includes("]") || query.includes("\n")) {
        setLink(null);
        return;
      }
      if (query !== link.query) setLink({ ...link, query, selected: 0 });
      return;
    }
    const typedBracket =
      block.type !== "code" &&
      raw.length === block.text.length + 1 &&
      raw.slice(caret - 2, caret) === "[[";
    if (typedBracket) setLink({ blockId: block.id, anchor: caret, query: "", selected: 0 });
  }

  /** Apply a picked link item: complete the `[[query` into `[[Title]]`. */
  function applyLinkItem(item: LinkMenuItem, block: Block) {
    if (!link) return;
    const title = item.kind === "page" ? item.target.title : item.title;
    if (item.kind === "create") onCreateLinkedPage?.(title);
    const text =
      block.text.slice(0, link.anchor) + title + "]]" + block.text.slice(link.anchor + link.query.length);
    setLink(null);
    pendingFocus.current = { id: block.id, caret: link.anchor + title.length + 2 };
    update(block.id, { text });
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
    trackLink(block, raw, caret);
    update(block.id, { text: raw });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>, block: Block, index: number) {
    const el = event.currentTarget;

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

    if (link && link.blockId === block.id && linkItems.length > 0) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        const count = linkItems.length;
        setLink({ ...link, selected: (link.selected + step + count) % count });
        return;
      }
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        applyLinkItem(linkItems[link.selected], block);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setLink(null);
        return;
      }
    }

    if (event.key === "Enter" && !event.shiftKey && block.type !== "code") {
      event.preventDefault();
      // empty list item: outdent first, then exit the list
      if (isListType(block.type) && block.text === "") {
        if ((block.indent ?? 0) > 0) update(block.id, { indent: (block.indent ?? 0) - 1 });
        else update(block.id, { type: "text" });
        return;
      }
      // split the block at the caret; lists continue as the same list type
      const caret = el.selectionStart ?? block.text.length;
      const follower: Block = {
        ...createBlock(isListType(block.type) ? block.type : "text"),
        text: block.text.slice(caret),
        indent: block.indent,
      };
      const next = list.map((b) => (b.id === block.id ? { ...b, text: block.text.slice(0, caret) } : b));
      pendingFocus.current = { id: follower.id, caret: 0 };
      onChange([...next.slice(0, index + 1), follower, ...next.slice(index + 1)]);
      return;
    }

    if (event.key === "Backspace" && el.selectionStart === 0 && el.selectionEnd === 0) {
      if ((block.indent ?? 0) > 0) {
        event.preventDefault();
        update(block.id, { indent: (block.indent ?? 0) - 1 });
        return;
      }
      if (block.type !== "text") {
        event.preventDefault();
        update(block.id, { type: "text" });
        return;
      }
      if (index === 0) {
        if (block.text === "" && list.length > 1) {
          event.preventDefault();
          pendingFocus.current = !isNonText(list[1].type) ? { id: list[1].id, caret: 0 } : null;
          onChange(list.slice(1));
        }
        return;
      }
      event.preventDefault();
      const prev = list[index - 1];
      if (prev.type === "divider") {
        onChange(list.filter((b) => b.id !== prev.id));
        return;
      }
      // never delete an image by backspacing into it — use its ✕ instead
      if (prev.type === "image") return;
      // merge into the previous block
      pendingFocus.current = { id: prev.id, caret: prev.text.length };
      onChange(
        list
          .map((b) => (b.id === prev.id ? { ...b, text: prev.text + block.text } : b))
          .filter((b) => b.id !== block.id),
      );
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const indent = block.indent ?? 0;
      if (event.shiftKey) {
        if (indent > 0) update(block.id, { indent: indent - 1 });
      } else if (indent < MAX_INDENT && index > 0) {
        update(block.id, { indent: indent + 1 });
      }
      return;
    }

    if ((event.altKey || event.metaKey) && event.key === "ArrowUp") {
      event.preventDefault();
      move(index, -1);
    } else if ((event.altKey || event.metaKey) && event.key === "ArrowDown") {
      event.preventDefault();
      move(index, 1);
    }
  }

  return {
    list,
    pendingFocus,
    slash,
    slashItems,
    setSlashSelected: (selected: number) => slash && setSlash({ ...slash, selected }),
    pickSlashItem: (itemIndex: number, block: Block, index: number) =>
      applySlashItem(slashItems[itemIndex], block, index),
    closeSlash: () => setSlash(null),
    link,
    linkItems,
    setLinkSelected: (selected: number) => link && setLink({ ...link, selected }),
    pickLinkItem: (itemIndex: number, block: Block) => applyLinkItem(linkItems[itemIndex], block),
    closeLink: () => setLink(null),
    toggleChecked: (block: Block) => update(block.id, { checked: !block.checked }),
    update,
    remove,
    reorder,
    duplicate,
    insertImageAfter,
    handleTextChange,
    handleKeyDown,
  };
}
