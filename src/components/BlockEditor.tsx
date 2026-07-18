import React, { useEffect, useRef, useState } from "react";
import { uid } from "../store";
import type { Block, BlockType } from "../types";

/**
 * Lightweight Notion-style block editor.
 * Markdown shortcuts at the start of a block convert it:
 *   "# "  → heading 1     "## " → heading 2
 *   "- "  → bullet        "[] " → to-do
 *   "> "  → quote         "```" → code
 *   "---" → divider       "/image" → image
 * Enter creates the next block, Backspace on an empty block removes it.
 * Blocks can be reordered with ⌥↑/⌥↓ or by dragging the ⋮⋮ handle.
 * Pasting an image from the clipboard inserts an image block.
 */
export function BlockEditor({ blocks, onChange }: { blocks: Block[]; onChange: (blocks: Block[]) => void }) {
  const focusId = useRef<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropAt, setDropAt] = useState<number | null>(null); // insertion index while dragging

  const list = blocks.length > 0 ? blocks : [{ id: uid(), type: "text" as BlockType, text: "" }];

  useEffect(() => {
    if (blocks.length === 0) onChange(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(id: string, patch: Partial<Block>) {
    onChange(list.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  function insertAfter(index: number, type: BlockType = "text", patch: Partial<Block> = {}) {
    const nb: Block = { id: uid(), type, text: "", ...patch };
    const next = [...list.slice(0, index + 1), nb, ...list.slice(index + 1)];
    focusId.current = nb.id;
    onChange(next);
  }

  function remove(index: number) {
    if (list.length === 1) {
      onChange([{ ...list[0], type: "text", text: "", url: undefined }]);
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

  function handleDrop() {
    if (dragIndex === null || dropAt === null) return;
    let to = dropAt;
    if (to === dragIndex || to === dragIndex + 1) {
      setDragIndex(null);
      setDropAt(null);
      return;
    }
    const next = [...list];
    const [moved] = next.splice(dragIndex, 1);
    if (to > dragIndex) to -= 1;
    next.splice(to, 0, moved);
    onChange(next);
    setDragIndex(null);
    setDropAt(null);
  }

  function dragOver(e: React.DragEvent, index: number) {
    if (dragIndex === null) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    setDropAt(before ? index : index + 1);
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
      if (raw === "/image" || raw === "/img") {
        update(b.id, { type: "image", text: "" });
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
      if (b.type !== "text") update(b.id, { type: "text", url: undefined });
      else remove(index);
    } else if ((e.altKey || e.metaKey) && e.key === "ArrowUp") {
      e.preventDefault();
      move(index, -1);
    } else if ((e.altKey || e.metaKey) && e.key === "ArrowDown") {
      e.preventDefault();
      move(index, 1);
    }
  }

  async function handlePaste(e: React.ClipboardEvent, index: number) {
    const file = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    e.preventDefault();
    const url = await fileToDataUri(file);
    insertAfter(index, "image", { url });
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
          onPaste={(e) => handlePaste(e, i)}
          onToggle={() => update(b.id, { checked: !b.checked })}
          onRemove={() => remove(i)}
          onSetUrl={(url) => update(b.id, { url })}
          dragging={dragIndex === i}
          dropBefore={dropAt === i}
          dropAfter={i === list.length - 1 && dropAt === list.length}
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            setDragIndex(i);
          }}
          onDragOver={(e) => dragOver(e, i)}
          onDrop={handleDrop}
          onDragEnd={() => {
            setDragIndex(null);
            setDropAt(null);
          }}
        />
      ))}
      <div className="editor-hint">
        Type <b># </b> for heading, <b>- </b> for bullet, <b>[] </b> for to-do, <b>&gt; </b> for quote,{" "}
        <b>```</b> for code, <b>---</b> for divider, <b>/image</b> for an image (or paste one). Drag <b>⋮⋮</b> or
        use ⌥↑/⌥↓ to move blocks.
      </div>
    </div>
  );
}

/** Read an image file into a data URI, downscaling big photos so state stays small. */
async function fileToDataUri(file: File): Promise<string> {
  const MAX_DIM = 1400;
  const KEEP_ORIGINAL_BYTES = 300 * 1024;
  const readAsDataUri = () =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  const original = await readAsDataUri();
  if (file.size <= KEEP_ORIGINAL_BYTES) return original;

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(original);
    img.src = original;
  });
}

const URL_RE = /https?:\/\/[^\s)]+/;

function BlockRow({
  block,
  autoFocus,
  onFocusDone,
  onText,
  onKey,
  onPaste,
  onToggle,
  onRemove,
  onSetUrl,
  dragging,
  dropBefore,
  dropAfter,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  block: Block;
  autoFocus: boolean;
  onFocusDone: () => void;
  onText: (t: string) => void;
  onKey: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onToggle: () => void;
  onRemove: () => void;
  onSetUrl: (url: string) => void;
  dragging: boolean;
  dropBefore: boolean;
  dropAfter: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
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

  const dropClass = `${dropBefore ? "drop-before" : ""} ${dropAfter ? "drop-after" : ""} ${dragging ? "dragging" : ""}`;
  const handleProps = {
    draggable: true,
    onDragStart,
    onDragEnd,
  };
  const rowProps = {
    onDragOver,
    onDrop,
  };

  if (block.type === "divider") {
    return (
      <div className={`block ${dropClass}`} {...rowProps}>
        <span className="handle" title="Drag to move · click to remove" onClick={onRemove} {...handleProps}>⋮⋮</span>
        <hr className="block-divider" />
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div className={`block image ${dropClass}`} {...rowProps}>
        <span className="handle" title="Drag to move" {...handleProps}>⋮⋮</span>
        <ImageBlock block={block} onSetUrl={onSetUrl} onCaption={onText} onRemove={onRemove} />
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

  const link = block.text.match(URL_RE)?.[0];

  return (
    <div className={`block ${block.type} ${dropClass}`} {...rowProps}>
      <span className="handle" title="Drag to move" {...handleProps}>⋮⋮</span>
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
        onPaste={onPaste}
      />
      {link && (
        <a className="block-link" href={link} target="_blank" rel="noopener noreferrer" title={`Open ${link}`}>
          ↗
        </a>
      )}
    </div>
  );
}

function ImageBlock({
  block,
  onSetUrl,
  onCaption,
  onRemove,
}: {
  block: Block;
  onSetUrl: (url: string) => void;
  onCaption: (t: string) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");

  if (!block.url) {
    return (
      <div className="image-picker">
        <button className="btn small" onClick={() => fileRef.current?.click()}>📁 Upload image</button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) onSetUrl(await fileToDataUri(f));
            e.target.value = "";
          }}
        />
        <span className="muted">or</span>
        <input
          placeholder="Paste an image URL…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && urlInput.trim()) onSetUrl(urlInput.trim());
          }}
        />
        <button className="btn small" disabled={!urlInput.trim()} onClick={() => onSetUrl(urlInput.trim())}>
          Add
        </button>
        <button className="icon-btn" title="Remove image block" onClick={onRemove}>✕</button>
      </div>
    );
  }

  return (
    <figure className="image-figure">
      <img src={block.url} alt={block.text || "Note image"} />
      <div className="image-tools">
        <input
          className="image-caption"
          placeholder="Add a caption…"
          value={block.text}
          onChange={(e) => onCaption(e.target.value)}
        />
        <button className="icon-btn" title="Remove image" onClick={onRemove}>✕</button>
      </div>
    </figure>
  );
}
