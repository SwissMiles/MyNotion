import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Block } from "../../types";
import { useActiveSemester, useDispatch } from "../../store";
import { createEmptyPage } from "../notes/pages";
import { BlockRow } from "./BlockRow";
import { SLASH_ITEMS } from "./slashMenu";
import type { LinkTarget } from "./wikiLinks";
import { isNonText, useBlockEditor } from "./useBlockEditor";

const TURN_INTO = SLASH_ITEMS.filter((item) => item.type !== "divider" && item.type !== "image");

/** Lightweight Notion-style block editor. Type "/" for the command menu,
 *  "[[" to link another page; see markdownShortcuts.ts for the markdown
 *  syntax. Blocks can be dragged by their handle to reorder; clicking the
 *  handle opens a block menu. */
export function BlockEditor({
  blocks,
  onChange,
  currentPageId,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  /** The page being edited — excluded from "[[" link suggestions. */
  currentPageId?: string;
}) {
  const { semester, pages } = useActiveSemester();
  const dispatch = useDispatch();

  const linkTargets = useMemo<LinkTarget[]>(
    () =>
      pages
        .filter((p) => p.id !== currentPageId && p.title.trim())
        .map((p) => ({ id: p.id, title: p.title.trim(), icon: p.icon })),
    [pages, currentPageId],
  );

  function createLinkedPage(title: string) {
    if (!semester) return;
    dispatch({ type: "addPage", page: createEmptyPage(semester.id, null, title) });
  }

  const editor = useBlockEditor(blocks, onChange, linkTargets, createLinkedPage);

  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const areaRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const [blockMenu, setBlockMenu] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);

  // Any click outside the block menu closes it.
  useEffect(() => {
    if (!blockMenu) return;
    const close = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".block-menu")) return;
      setBlockMenu(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [blockMenu]);

  function registerArea(id: string, el: HTMLTextAreaElement | null) {
    if (el) areaRefs.current.set(id, el);
    else areaRefs.current.delete(id);
  }

  /** Move the caret to the nearest editable neighbor (plain arrow keys). */
  function focusNeighbor(index: number, dir: -1 | 1, caret: "start" | "end"): boolean {
    for (let j = index + dir; j >= 0 && j < editor.list.length; j += dir) {
      if (isNonText(editor.list[j].type)) continue;
      const el = areaRefs.current.get(editor.list[j].id);
      if (!el) return false;
      el.focus();
      const pos = caret === "end" ? el.value.length : 0;
      el.setSelectionRange(pos, pos);
      return true;
    }
    return false;
  }

  function handleKey(event: React.KeyboardEvent<HTMLTextAreaElement>, block: Block, index: number) {
    editor.handleKeyDown(event, block, index);
    if (event.defaultPrevented) return;
    const el = event.currentTarget;
    if (event.key === "ArrowUp" && el.selectionStart === 0 && el.selectionEnd === 0) {
      if (focusNeighbor(index, -1, "end")) event.preventDefault();
    } else if (
      event.key === "ArrowDown" &&
      el.selectionStart === el.value.length &&
      el.selectionEnd === el.value.length
    ) {
      if (focusNeighbor(index, 1, "start")) event.preventDefault();
    }
  }

  // ----- drag to reorder (pointer events: works with mouse and touch) -----

  function dropIndexAt(y: number): number {
    for (let i = 0; i < editor.list.length; i++) {
      const row = rowRefs.current.get(editor.list[i].id);
      if (!row) continue;
      const rect = row.getBoundingClientRect();
      if (y < rect.top + rect.height / 2) return i;
    }
    return editor.list.length;
  }

  function startDrag(event: React.PointerEvent, index: number, blockId: string) {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const menuWasOpen = blockMenu === blockId;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 5) {
        moved = true;
        setBlockMenu(null);
        editor.closeSlash();
        editor.closeLink();
        setDragIndex(index);
        document.body.classList.add("is-dragging");
      }
      if (moved) setDropAt(dropIndexAt(ev.clientY));
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.body.classList.remove("is-dragging");
      setDragIndex(null);
      setDropAt(null);
      if (moved) {
        if (ev.type !== "pointercancel") editor.reorder(index, dropIndexAt(ev.clientY));
      } else {
        // a plain click on the handle toggles the block menu
        setBlockMenu(menuWasOpen ? null : blockId);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  // ----- render -----

  /** 1-based number for a numbered block: counts the run of numbered
   *  siblings at the same indent right above it. */
  function numberFor(index: number): number {
    const indent = editor.list[index].indent ?? 0;
    let n = 1;
    for (let j = index - 1; j >= 0; j--) {
      const prev = editor.list[j];
      if (prev.type !== "numbered" || (prev.indent ?? 0) < indent) break;
      if ((prev.indent ?? 0) === indent) n++;
    }
    return n;
  }

  function blockMenuFor(block: Block, index: number): React.ReactNode {
    if (blockMenu !== block.id) return null;
    return (
      <div className="block-menu" onPointerDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="bm-item"
          onClick={() => {
            editor.duplicate(index);
            setBlockMenu(null);
          }}
        >
          <span className="bm-icon">⧉</span> Duplicate
        </button>
        <button
          type="button"
          className="bm-item danger"
          onClick={() => {
            setBlockMenu(null);
            editor.remove(index);
          }}
        >
          <span className="bm-icon">🗑</span> Delete
        </button>
        {!isNonText(block.type) && (
          <>
            <div className="bm-sep" />
            <div className="bm-label">Turn into</div>
            {TURN_INTO.map((item) => (
              <button
                key={item.type}
                type="button"
                className={`bm-item ${item.type === block.type ? "current" : ""}`}
                onClick={() => {
                  editor.update(block.id, { type: item.type });
                  setBlockMenu(null);
                }}
              >
                <span className="bm-icon">{item.icon}</span> {item.title}
              </button>
            ))}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="block-editor">
      {editor.list.map((block, index) => {
        const dragClass = [
          dragIndex === index ? "drag-src" : "",
          dropAt === index ? "drop-before" : "",
          dropAt === editor.list.length && index === editor.list.length - 1 ? "drop-after" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
            <BlockRow
              key={block.id}
              block={block}
              registerRow={(id, el) => {
                if (el) rowRefs.current.set(id, el);
                else rowRefs.current.delete(id);
              }}
              number={block.type === "numbered" ? numberFor(index) : 0}
              autoFocus={editor.pendingFocus.current?.id === block.id}
              focusCaret={editor.pendingFocus.current?.caret}
              onFocusDone={() => (editor.pendingFocus.current = null)}
              registerArea={registerArea}
              onText={(text, caret) => editor.handleTextChange(block, index, text, caret)}
              onKey={(event) => handleKey(event, block, index)}
              onToggle={() => editor.toggleChecked(block)}
              onRemove={() => editor.remove(index)}
              onSetUrl={(url) => editor.update(block.id, { url })}
              onCaption={(text) => editor.update(block.id, { text })}
              onPasteImage={(url) => editor.insertImageAfter(index, url)}
              onHandlePointerDown={(event) => startDrag(event, index, block.id)}
              dragClass={dragClass}
              menu={blockMenuFor(block, index)}
              slashItems={editor.slash?.blockId === block.id ? editor.slashItems : null}
              slashSelected={editor.slash?.selected ?? 0}
              onSlashHover={editor.setSlashSelected}
              onSlashPick={(itemIndex) => editor.pickSlashItem(itemIndex, block, index)}
              onSlashClose={() => {
                editor.closeSlash();
                editor.closeLink();
              }}
              linkItems={editor.link?.blockId === block.id ? editor.linkItems : null}
              linkSelected={editor.link?.selected ?? 0}
              onLinkHover={editor.setLinkSelected}
              onLinkPick={(itemIndex) => editor.pickLinkItem(itemIndex, block)}
            />
        );
      })}
      <div className="editor-hint">
        Type <b>/</b> for commands, <b>[[</b> to link a page — or <b># </b> heading, <b>- </b>{" "}
        bullet, <b>1. </b> numbered, <b>[] </b> to-do, <b>&gt; </b> quote, <b>```</b> code,{" "}
        <b>---</b> divider. Tab indents, ⌥↑/⌥↓ moves a block, drag the ⋮⋮ handle to reorder.
      </div>
    </div>
  );
}
