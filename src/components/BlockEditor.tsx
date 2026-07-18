import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { uid } from "../store";
import type { Block, BlockType } from "../types";

/**
 * Notion-style block editor.
 *
 * - "/" opens a filterable command menu to insert or convert blocks.
 * - Every block has a drag handle: drag to reorder (mouse & touch),
 *   tap/click it for a block menu (turn into, duplicate, delete).
 * - Enter splits the block at the caret, Backspace at the start merges
 *   with the previous block, Tab / Shift-Tab indents and outdents.
 * - Markdown shortcuts still work: "# ", "## ", "### ", "- ", "1. ",
 *   "[] ", "> ", "```" and "---".
 */

const MAX_INDENT = 4;

type MenuOption = { type: BlockType; icon: string; label: string; desc: string; keywords: string };

const MENU_OPTIONS: MenuOption[] = [
  { type: "text", icon: "Aa", label: "Text", desc: "Just start writing with plain text", keywords: "text plain paragraph" },
  { type: "h1", icon: "H1", label: "Heading 1", desc: "Big section heading", keywords: "heading title big #" },
  { type: "h2", icon: "H2", label: "Heading 2", desc: "Medium section heading", keywords: "heading subtitle ##" },
  { type: "h3", icon: "H3", label: "Heading 3", desc: "Small section heading", keywords: "heading ###" },
  { type: "todo", icon: "☑", label: "To-do list", desc: "Track tasks with a checkbox", keywords: "todo task checkbox check" },
  { type: "bullet", icon: "•", label: "Bulleted list", desc: "Create a simple bulleted list", keywords: "bullet unordered list -" },
  { type: "numbered", icon: "1.", label: "Numbered list", desc: "Create a list with numbering", keywords: "numbered ordered list" },
  { type: "quote", icon: "❝", label: "Quote", desc: "Capture a quote", keywords: "quote blockquote citation" },
  { type: "callout", icon: "💡", label: "Callout", desc: "Make writing stand out", keywords: "callout highlight info note" },
  { type: "code", icon: "</>", label: "Code", desc: "Capture a code snippet", keywords: "code snippet monospace" },
  { type: "divider", icon: "―", label: "Divider", desc: "Visually divide blocks", keywords: "divider separator line hr rule" },
];

const TURN_INTO = MENU_OPTIONS.filter((o) => o.type !== "divider");

const MD_SHORTCUTS: [string, BlockType][] = [
  ["# ", "h1"],
  ["## ", "h2"],
  ["### ", "h3"],
  ["- ", "bullet"],
  ["* ", "bullet"],
  ["1. ", "numbered"],
  ["[] ", "todo"],
  ["[ ] ", "todo"],
  ["> ", "quote"],
  ["```", "code"],
];

function isListType(t: BlockType) {
  return t === "bullet" || t === "todo" || t === "numbered";
}

export function BlockEditor({ blocks, onChange }: { blocks: Block[]; onChange: (blocks: Block[]) => void }) {
  const list = blocks.length > 0 ? blocks : [{ id: uid(), type: "text" as BlockType, text: "" }];

  useEffect(() => {
    if (blocks.length === 0) onChange(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // slash command menu: slashPos is the index of the typed "/" (null when
  // opened from the "+" button, where the whole block text is the query)
  const [menu, setMenu] = useState<{ blockId: string; slashPos: number | null } | null>(null);
  const [menuSel, setMenuSel] = useState(0);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [blockMenu, setBlockMenu] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const areaRefs = useRef(new Map<string, HTMLTextAreaElement>());
  const pendingFocus = useRef<{ id: string; caret?: number } | null>(null);

  const menuBlock = menu ? list.find((b) => b.id === menu.blockId) ?? null : null;
  const query = menuBlock ? (menu!.slashPos === null ? menuBlock.text : menuBlock.text.slice(menu!.slashPos + 1)) : "";
  const q = query.trim().toLowerCase();
  const filtered = MENU_OPTIONS.filter((o) => !q || o.label.toLowerCase().includes(q) || o.keywords.includes(q));

  // ----- focus & sizing -----

  useLayoutEffect(() => {
    areaRefs.current.forEach((el) => {
      el.style.height = "0";
      el.style.height = `${el.scrollHeight}px`;
    });
  });

  useLayoutEffect(() => {
    const pf = pendingFocus.current;
    if (!pf) return;
    const el = areaRefs.current.get(pf.id);
    if (el) {
      el.focus();
      const caret = pf.caret ?? el.value.length;
      el.setSelectionRange(caret, caret);
    }
    pendingFocus.current = null;
  });

  // ----- slash menu position / lifecycle -----

  useLayoutEffect(() => {
    if (!menu) {
      setMenuPos(null);
      return;
    }
    const row = rowRefs.current.get(menu.blockId);
    const editor = editorRef.current;
    if (!row || !editor) return;
    const r = row.getBoundingClientRect();
    const er = editor.getBoundingClientRect();
    const flipUp = r.bottom + 340 > window.innerHeight && r.top - 340 > 0;
    setMenuPos({
      top: flipUp ? r.top - er.top - 336 : r.bottom - er.top + 4,
      left: Math.max(0, Math.min(r.left - er.left, er.width - 324)),
    });
  }, [menu]);

  useEffect(() => setMenuSel(0), [q, menu?.blockId]);

  useEffect(() => {
    // give up on the menu once the query clearly matches nothing
    if (menu && filtered.length === 0 && query.length > 8) setMenu(null);
  }, [menu, filtered.length, query.length]);

  useEffect(() => {
    if (!menu && !blockMenu) return;
    const close = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest(".slash-menu") || t?.closest(".block-menu")) return;
      setMenu(null);
      setBlockMenu(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menu, blockMenu]);

  useEffect(() => {
    if (!menu) return;
    document.querySelector(".slash-item.sel")?.scrollIntoView({ block: "nearest" });
  }, [menuSel, menu]);

  // ----- list operations -----

  function update(id: string, patch: Partial<Block>) {
    onChange(list.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function removeAt(index: number) {
    if (list.length === 1) {
      onChange([{ ...list[0], type: "text", text: "", checked: false, indent: 0 }]);
      return;
    }
    const neighbor = list[index - 1] ?? list[index + 1];
    if (neighbor && neighbor.type !== "divider") pendingFocus.current = { id: neighbor.id };
    onChange(list.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[index], next[j]] = [next[j], next[index]];
    pendingFocus.current = { id: next[j].id };
    onChange(next);
  }

  function addBlockBelow(index: number) {
    const nb: Block = { id: uid(), type: "text", text: "" };
    pendingFocus.current = { id: nb.id };
    onChange([...list.slice(0, index + 1), nb, ...list.slice(index + 1)]);
    setBlockMenu(null);
    setMenu({ blockId: nb.id, slashPos: null });
  }

  function duplicateBlock(index: number) {
    const nb: Block = { ...list[index], id: uid() };
    pendingFocus.current = { id: nb.id };
    onChange([...list.slice(0, index + 1), nb, ...list.slice(index + 1)]);
    setBlockMenu(null);
  }

  // ----- slash menu -----

  function applyMenu(opt: MenuOption) {
    if (!menu) return;
    const index = list.findIndex((x) => x.id === menu.blockId);
    if (index < 0) {
      setMenu(null);
      return;
    }
    const b = list[index];
    const kept = menu.slashPos === null ? "" : b.text.slice(0, menu.slashPos);
    if (opt.type === "divider") {
      const divider: Block = { id: uid(), type: "divider", text: "" };
      const fresh: Block = { id: uid(), type: "text", text: "" };
      const next = [...list];
      if (kept.trim() === "") {
        next.splice(index, 1, divider, fresh);
        pendingFocus.current = { id: fresh.id, caret: 0 };
      } else {
        next[index] = { ...b, text: kept };
        next.splice(index + 1, 0, divider, fresh);
        pendingFocus.current = { id: fresh.id, caret: 0 };
      }
      onChange(next);
    } else {
      onChange(list.map((x) => (x.id === b.id ? { ...x, type: opt.type, text: kept } : x)));
      pendingFocus.current = { id: b.id, caret: kept.length };
    }
    setMenu(null);
  }

  // ----- typing -----

  function handleText(b: Block, index: number, raw: string, caret: number) {
    if (menu && menu.blockId === b.id) {
      // keep the menu in sync; close it if the "/" that opened it is gone
      if (menu.slashPos !== null && raw[menu.slashPos] !== "/") setMenu(null);
    } else if (
      b.type !== "code" &&
      caret > 0 &&
      raw[caret - 1] === "/" &&
      raw.length === b.text.length + 1
    ) {
      setMenu({ blockId: b.id, slashPos: caret - 1 });
    }

    if (b.type === "text" && !(menu && menu.blockId === b.id)) {
      for (const [prefix, type] of MD_SHORTCUTS) {
        if (raw.startsWith(prefix)) {
          update(b.id, { type, text: raw.slice(prefix.length) });
          return;
        }
      }
      if (raw === "---") {
        const fresh: Block = { id: uid(), type: "text", text: "" };
        const next = list.map((x, i) => (i === index ? { ...x, type: "divider" as BlockType, text: "" } : x));
        pendingFocus.current = { id: fresh.id, caret: 0 };
        onChange([...next.slice(0, index + 1), fresh, ...next.slice(index + 1)]);
        return;
      }
    }
    update(b.id, { text: raw });
  }

  function focusNeighbor(index: number, dir: -1 | 1, caret: "start" | "end") {
    for (let j = index + dir; j >= 0 && j < list.length; j += dir) {
      if (list[j].type === "divider") continue;
      const el = areaRefs.current.get(list[j].id);
      if (el) {
        el.focus();
        const pos = caret === "end" ? el.value.length : 0;
        el.setSelectionRange(pos, pos);
      }
      return true;
    }
    return false;
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>, b: Block, index: number) {
    const el = e.currentTarget;

    // only intercept keys while the menu is actually visible (it has matches);
    // a "/" typed mid-word (e.g. "dv/dt") must not swallow Enter
    if (menu && menu.blockId === b.id && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMenuSel((s) => Math.min(s + 1, filtered.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMenuSel((s) => Math.max(s - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filtered[menuSel]) applyMenu(filtered[menuSel]);
        else setMenu(null);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMenu(null);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey && b.type !== "code") {
      e.preventDefault();
      if (menu) setMenu(null);
      // empty list item: outdent, then exit the list
      if (isListType(b.type) && b.text === "") {
        if ((b.indent ?? 0) > 0) update(b.id, { indent: (b.indent ?? 0) - 1 });
        else update(b.id, { type: "text" });
        return;
      }
      const pos = el.selectionStart ?? b.text.length;
      const nb: Block = {
        id: uid(),
        type: isListType(b.type) ? b.type : "text",
        text: b.text.slice(pos),
        indent: b.indent,
      };
      const next = list.map((x) => (x.id === b.id ? { ...x, text: b.text.slice(0, pos) } : x));
      pendingFocus.current = { id: nb.id, caret: 0 };
      onChange([...next.slice(0, index + 1), nb, ...next.slice(index + 1)]);
      return;
    }

    if (e.key === "Backspace" && el.selectionStart === 0 && el.selectionEnd === 0) {
      if ((b.indent ?? 0) > 0) {
        e.preventDefault();
        update(b.id, { indent: (b.indent ?? 0) - 1 });
        return;
      }
      if (b.type !== "text") {
        e.preventDefault();
        update(b.id, { type: "text" });
        return;
      }
      if (index === 0) {
        if (b.text === "" && list.length > 1) {
          e.preventDefault();
          pendingFocus.current = list[1].type !== "divider" ? { id: list[1].id, caret: 0 } : null;
          onChange(list.slice(1));
        }
        return;
      }
      e.preventDefault();
      const prev = list[index - 1];
      if (prev.type === "divider") {
        onChange(list.filter((x) => x.id !== prev.id));
        return;
      }
      pendingFocus.current = { id: prev.id, caret: prev.text.length };
      onChange(
        list
          .map((x) => (x.id === prev.id ? { ...x, text: prev.text + b.text } : x))
          .filter((x) => x.id !== b.id),
      );
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const ind = b.indent ?? 0;
      if (e.shiftKey) {
        if (ind > 0) update(b.id, { indent: ind - 1 });
      } else if (ind < MAX_INDENT && index > 0) {
        update(b.id, { indent: ind + 1 });
      }
      return;
    }

    if ((e.altKey || e.metaKey) && e.key === "ArrowUp") {
      e.preventDefault();
      moveBlock(index, -1);
      return;
    }
    if ((e.altKey || e.metaKey) && e.key === "ArrowDown") {
      e.preventDefault();
      moveBlock(index, 1);
      return;
    }

    if (e.key === "ArrowUp" && el.selectionStart === 0 && el.selectionEnd === 0) {
      if (focusNeighbor(index, -1, "end")) e.preventDefault();
      return;
    }
    if (e.key === "ArrowDown" && el.selectionStart === el.value.length && el.selectionEnd === el.value.length) {
      if (focusNeighbor(index, 1, "start")) e.preventDefault();
      return;
    }
  }

  // ----- drag to reorder (pointer events: works with mouse and touch) -----

  function computeDropIndex(y: number): number {
    for (let i = 0; i < list.length; i++) {
      const row = rowRefs.current.get(list[i].id);
      if (!row) continue;
      const r = row.getBoundingClientRect();
      if (y < r.top + r.height / 2) return i;
    }
    return list.length;
  }

  function startDrag(e: React.PointerEvent, index: number, blockId: string) {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const menuWasOpen = blockMenu === blockId;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 5) {
        moved = true;
        setBlockMenu(null);
        setMenu(null);
        setDragIndex(index);
        document.body.classList.add("is-dragging");
      }
      if (moved) setDropAt(computeDropIndex(ev.clientY));
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.body.classList.remove("is-dragging");
      setDragIndex(null);
      setDropAt(null);
      if (moved) {
        if (ev.type === "pointercancel") return;
        const at = computeDropIndex(ev.clientY);
        if (at !== index && at !== index + 1) {
          const next = [...list];
          const [moving] = next.splice(index, 1);
          next.splice(at > index ? at - 1 : at, 0, moving);
          onChange(next);
        }
      } else {
        setMenu(null);
        setBlockMenu(menuWasOpen ? null : blockId);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  // ----- render -----

  function numberFor(index: number): number {
    const ind = list[index].indent ?? 0;
    let n = 1;
    for (let j = index - 1; j >= 0; j--) {
      const pb = list[j];
      if (pb.type !== "numbered" || (pb.indent ?? 0) < ind) break;
      if ((pb.indent ?? 0) === ind) n++;
    }
    return n;
  }

  function placeholderFor(b: Block): string {
    switch (b.type) {
      case "h1": return "Heading 1";
      case "h2": return "Heading 2";
      case "h3": return "Heading 3";
      case "todo": return "To-do";
      case "bullet":
      case "numbered": return "List";
      case "quote": return "Quote";
      case "callout": return "Callout";
      case "code": return "Code";
      default:
        return focusedId === b.id || list.length === 1 ? "Type '/' for commands" : "";
    }
  }

  function clickTail() {
    const last = list[list.length - 1];
    if (last && last.type === "text" && last.text === "") {
      areaRefs.current.get(last.id)?.focus();
    } else {
      const nb: Block = { id: uid(), type: "text", text: "" };
      pendingFocus.current = { id: nb.id };
      onChange([...list, nb]);
    }
  }

  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches;

  return (
    <div className="block-editor" ref={editorRef}>
      {list.map((b, i) => {
        const rowClass = [
          "block",
          b.type,
          dragIndex === i ? "drag-src" : "",
          dropAt === i ? "drop-before" : "",
          dropAt === list.length && i === list.length - 1 ? "drop-after" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <div
            key={b.id}
            className={rowClass}
            style={(b.indent ?? 0) > 0 ? { marginLeft: (b.indent ?? 0) * 24 } : undefined}
            ref={(el) => {
              if (el) rowRefs.current.set(b.id, el);
              else rowRefs.current.delete(b.id);
            }}
          >
            <div className="block-controls">
              <button
                type="button"
                tabIndex={-1}
                className="block-btn plus"
                title="Add a block below"
                onClick={() => addBlockBelow(i)}
              >
                +
              </button>
              <button
                type="button"
                tabIndex={-1}
                className="block-btn handle"
                title="Drag to move · click for options"
                onPointerDown={(e) => startDrag(e, i, b.id)}
              >
                ⋮⋮
              </button>
            </div>

            {b.type === "divider" ? (
              <div className="block-body">
                <hr className="block-divider" />
              </div>
            ) : (
              <div className="block-body">
                {b.type === "todo" && (
                  <button
                    type="button"
                    className={`todo-check ${b.checked ? "on" : ""}`}
                    aria-label={b.checked ? "Mark as not done" : "Mark as done"}
                    onClick={() => update(b.id, { checked: !b.checked })}
                  >
                    {b.checked ? "✓" : ""}
                  </button>
                )}
                {b.type === "bullet" && <span className="block-marker">•</span>}
                {b.type === "numbered" && <span className="block-marker num">{numberFor(i)}.</span>}
                {b.type === "callout" && <span className="callout-icon">💡</span>}
                <textarea
                  ref={(el) => {
                    if (el) areaRefs.current.set(b.id, el);
                    else areaRefs.current.delete(b.id);
                  }}
                  rows={1}
                  className={`block-input ${b.type === "todo" && b.checked ? "checked-text" : ""}`}
                  value={b.text}
                  placeholder={placeholderFor(b)}
                  onChange={(e) => handleText(b, i, e.target.value, e.target.selectionStart ?? e.target.value.length)}
                  onKeyDown={(e) => handleKey(e, b, i)}
                  onFocus={() => setFocusedId(b.id)}
                  onBlur={() => setFocusedId((f) => (f === b.id ? null : f))}
                />
              </div>
            )}

            {blockMenu === b.id && (
              <div className="block-menu" onPointerDown={(e) => e.stopPropagation()}>
                <button type="button" className="bm-item" onClick={() => duplicateBlock(i)}>
                  <span className="bm-icon">⧉</span> Duplicate
                </button>
                <button
                  type="button"
                  className="bm-item danger"
                  onClick={() => {
                    setBlockMenu(null);
                    removeAt(i);
                  }}
                >
                  <span className="bm-icon">🗑</span> Delete
                </button>
                <div className="bm-sep" />
                <div className="bm-label">Turn into</div>
                {TURN_INTO.map((o) => (
                  <button
                    key={o.type}
                    type="button"
                    className={`bm-item ${o.type === b.type ? "current" : ""}`}
                    onClick={() => {
                      update(b.id, { type: o.type });
                      setBlockMenu(null);
                    }}
                  >
                    <span className="bm-icon">{o.icon}</span> {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="editor-tail" onClick={clickTail} />

      {menu && filtered.length > 0 && (
        <div
          className={`slash-menu ${isMobile ? "sheet" : ""}`}
          style={isMobile ? undefined : menuPos ?? undefined}
          onPointerDown={(e) => e.preventDefault()}
        >
          <div className="slash-menu-title">Basic blocks</div>
          {filtered.map((o, idx) => (
            <button
              key={o.type}
              type="button"
              className={`slash-item ${idx === menuSel ? "sel" : ""}`}
              onMouseEnter={() => setMenuSel(idx)}
              onClick={() => applyMenu(o)}
            >
              <span className="slash-icon">{o.icon}</span>
              <span className="slash-text">
                <span className="slash-label">{o.label}</span>
                <span className="slash-desc">{o.desc}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
