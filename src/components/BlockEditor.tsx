import React, { useEffect, useRef } from "react";
import { uid } from "../store";
import type { Block, BlockType } from "../types";

/**
 * Lightweight Notion-style block editor.
 * Markdown shortcuts at the start of a block convert it:
 *   "# "  → heading 1     "## " → heading 2
 *   "- "  → bullet        "[] " → to-do
 *   "> "  → quote         "```" → code
 *   "---" → divider
 * Enter creates the next block, Backspace on an empty block removes it.
 */
export function BlockEditor({ blocks, onChange }: { blocks: Block[]; onChange: (blocks: Block[]) => void }) {
  const focusId = useRef<string | null>(null);

  const list = blocks.length > 0 ? blocks : [{ id: uid(), type: "text" as BlockType, text: "" }];

  useEffect(() => {
    if (blocks.length === 0) onChange(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(id: string, patch: Partial<Block>) {
    onChange(list.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function insertAfter(index: number, type: BlockType = "text") {
    const nb: Block = { id: uid(), type, text: "" };
    const next = [...list.slice(0, index + 1), nb, ...list.slice(index + 1)];
    focusId.current = nb.id;
    onChange(next);
  }

  function remove(index: number) {
    if (list.length === 1) {
      onChange([{ ...list[0], type: "text", text: "" }]);
      return;
    }
    const prev = list[index - 1] ?? list[index + 1];
    focusId.current = prev?.id ?? null;
    onChange(list.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[index], next[j]] = [next[j], next[index]];
    focusId.current = next[j].id;
    onChange(next);
  }

  function handleText(b: Block, index: number, raw: string) {
    // markdown-style conversions when typing at the start of a text block
    if (b.type === "text") {
      const conversions: [string, BlockType][] = [
        ["# ", "h1"],
        ["## ", "h2"],
        ["- ", "bullet"],
        ["[] ", "todo"],
        ["> ", "quote"],
        ["```", "code"],
      ];
      for (const [prefix, type] of conversions) {
        if (raw.startsWith(prefix)) {
          update(b.id, { type, text: raw.slice(prefix.length) });
          return;
        }
      }
      if (raw === "---") {
        const next = list.map((x, i) => (i === index ? { ...x, type: "divider" as BlockType, text: "" } : x));
        onChange([...next.slice(0, index + 1), { id: uid(), type: "text", text: "" }, ...next.slice(index + 1)]);
        return;
      }
    }
    update(b.id, { text: raw });
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>, b: Block, index: number) {
    if (e.key === "Enter" && !e.shiftKey && b.type !== "code") {
      e.preventDefault();
      // continue lists: new bullet/todo after a non-empty one, exit after an empty one
      if ((b.type === "bullet" || b.type === "todo") && b.text === "") {
        update(b.id, { type: "text" });
      } else {
        insertAfter(index, b.type === "bullet" || b.type === "todo" ? b.type : "text");
      }
    } else if (e.key === "Backspace" && b.text === "") {
      e.preventDefault();
      if (b.type !== "text") update(b.id, { type: "text" });
      else remove(index);
    } else if ((e.altKey || e.metaKey) && e.key === "ArrowUp") {
      e.preventDefault();
      move(index, -1);
    } else if ((e.altKey || e.metaKey) && e.key === "ArrowDown") {
      e.preventDefault();
      move(index, 1);
    }
  }

  return (
    <div className="block-editor">
      {list.map((b, i) => (
        <BlockRow
          key={b.id}
          block={b}
          autoFocus={focusId.current === b.id}
          onFocusDone={() => (focusId.current = null)}
          onText={(t) => handleText(b, i, t)}
          onKey={(e) => handleKey(e, b, i)}
          onToggle={() => update(b.id, { checked: !b.checked })}
          onRemove={() => remove(i)}
        />
      ))}
      <div className="editor-hint">
        Type <b># </b> for heading, <b>- </b> for bullet, <b>[] </b> for to-do, <b>&gt; </b> for quote,{" "}
        <b>```</b> for code, <b>---</b> for divider. ⌥↑/⌥↓ moves a block.
      </div>
    </div>
  );
}

function BlockRow({
  block,
  autoFocus,
  onFocusDone,
  onText,
  onKey,
  onToggle,
  onRemove,
}: {
  block: Block;
  autoFocus: boolean;
  onFocusDone: () => void;
  onText: (t: string) => void;
  onKey: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
      onFocusDone();
    }
  }, [autoFocus, onFocusDone]);

  // auto-grow the textarea to fit its content
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [block.text, block.type]);

  if (block.type === "divider") {
    return (
      <div className="block">
        <span className="handle" onClick={onRemove} title="Remove divider">✕</span>
        <hr className="block-divider" />
      </div>
    );
  }

  const placeholder =
    block.type === "h1" ? "Heading 1" :
    block.type === "h2" ? "Heading 2" :
    block.type === "todo" ? "To-do" :
    block.type === "bullet" ? "List item" :
    block.type === "code" ? "Code" :
    "Type something, or '/' won't help — try '# '…";

  return (
    <div className={`block ${block.type}`}>
      <span className="handle" title="Block">⋮⋮</span>
      {block.type === "todo" && <input type="checkbox" checked={!!block.checked} onChange={onToggle} />}
      {block.type === "bullet" && <span className="bullet-mark">•</span>}
      <textarea
        ref={ref}
        rows={1}
        className={`block-input ${block.type === "todo" && block.checked ? "checked-text" : ""}`}
        value={block.text}
        placeholder={placeholder}
        onChange={(e) => onText(e.target.value)}
        onKeyDown={onKey}
      />
    </div>
  );
}
