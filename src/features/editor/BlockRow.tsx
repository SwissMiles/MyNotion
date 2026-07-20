import React, { useEffect, useRef, useState } from "react";
import type { Block, BlockType } from "../../types";
import { cssVars } from "../../utils/cssVars";
import { fileToDataUri } from "./images";
import { SlashMenu } from "./SlashMenu";
import type { SlashItem } from "./slashMenu";

const PLACEHOLDERS: Record<Exclude<BlockType, "divider" | "image">, string> = {
  h1: "Heading 1",
  h2: "Heading 2",
  h3: "Heading 3",
  todo: "To-do",
  bullet: "List item",
  numbered: "List item",
  code: "Code",
  quote: "Quote",
  callout: "Callout",
  text: "Type '/' for commands…",
};

const URL_RE = /https?:\/\/[^\s)]+/;

export function BlockRow({
  block,
  number,
  registerRow,
  autoFocus,
  focusCaret,
  onFocusDone,
  registerArea,
  onText,
  onKey,
  onToggle,
  onRemove,
  onSetUrl,
  onCaption,
  onPasteImage,
  onHandlePointerDown,
  dragClass,
  menu,
  slashItems,
  slashSelected,
  onSlashHover,
  onSlashPick,
  onSlashClose,
}: {
  block: Block;
  /** 1-based number shown for numbered-list blocks. */
  number: number;
  /** Lets the editor track row elements for drag-and-drop hit testing. */
  registerRow: (id: string, el: HTMLDivElement | null) => void;
  autoFocus: boolean;
  /** Caret position to restore when autofocusing (end of text when undefined). */
  focusCaret?: number;
  onFocusDone: () => void;
  /** Lets the editor track textareas for arrow-key navigation between blocks. */
  registerArea: (id: string, el: HTMLTextAreaElement | null) => void;
  onText: (text: string, caret: number) => void;
  onKey: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onToggle: () => void;
  onRemove: () => void;
  onSetUrl: (url: string) => void;
  onCaption: (text: string) => void;
  onPasteImage: (url: string) => void;
  /** Starts drag-to-reorder (drag) or opens the block menu (click). */
  onHandlePointerDown: (event: React.PointerEvent) => void;
  /** Extra classes while a drag is in progress (source / drop target). */
  dragClass: string;
  /** The block menu when open for this block, rendered inside the row. */
  menu: React.ReactNode;
  slashItems: SlashItem[] | null; // null = menu closed for this block
  slashSelected: number;
  onSlashHover: (index: number) => void;
  onSlashPick: (index: number) => void;
  onSlashClose: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      const el = textareaRef.current;
      el.focus();
      const caret = focusCaret ?? el.value.length;
      el.setSelectionRange(caret, caret);
      onFocusDone();
    }
  }, [autoFocus, focusCaret, onFocusDone]);

  useAutoGrow(textareaRef, block);

  async function handlePaste(event: React.ClipboardEvent) {
    const file = Array.from(event.clipboardData.files).find((f) => f.type.startsWith("image/"));
    if (!file) return;
    event.preventDefault();
    onPasteImage(await fileToDataUri(file));
  }

  const controls = (
    <span
      className="handle"
      title="Drag to move · click for options"
      onPointerDown={onHandlePointerDown}
    >
      ⋮⋮
    </span>
  );

  const rowRef = (el: HTMLDivElement | null) => registerRow(block.id, el);

  if (block.type === "divider") {
    return (
      <div ref={rowRef} className={`block ${dragClass}`}>
        {controls}
        <hr className="block-divider" />
        {menu}
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div ref={rowRef} className={`block image ${dragClass}`}>
        {controls}
        <ImageBlock block={block} onSetUrl={onSetUrl} onCaption={onCaption} onRemove={onRemove} />
        {menu}
      </div>
    );
  }

  const linkMatch = block.type !== "code" ? block.text.match(URL_RE) : null;

  return (
    <div
      ref={rowRef}
      className={`block ${block.type} ${dragClass}`}
      style={cssVars({ "--block-indent": block.indent ?? 0 })}
    >
      {controls}
      {block.type === "todo" && (
        <input type="checkbox" checked={!!block.checked} onChange={onToggle} />
      )}
      {block.type === "bullet" && <span className="bullet-mark">•</span>}
      {block.type === "numbered" && <span className="bullet-mark numbered-mark">{number}.</span>}
      {block.type === "callout" && <span className="callout-icon">💡</span>}
      <textarea
        ref={(el) => {
          (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
          registerArea(block.id, el);
        }}
        rows={1}
        className={`block-input ${block.type === "todo" && block.checked ? "checked-text" : ""}`}
        value={block.text}
        placeholder={PLACEHOLDERS[block.type]}
        onChange={(e) => onText(e.target.value, e.target.selectionStart ?? e.target.value.length)}
        onKeyDown={onKey}
        onBlur={onSlashClose}
        onPaste={handlePaste}
      />
      {linkMatch && (
        <a
          className="block-link"
          href={linkMatch[0]}
          target="_blank"
          rel="noopener noreferrer"
          title={`Open ${linkMatch[0]}`}
        >
          ↗
        </a>
      )}
      {slashItems && (
        <SlashMenu
          items={slashItems}
          selected={slashSelected}
          onHover={onSlashHover}
          onPick={onSlashPick}
        />
      )}
      {menu}
    </div>
  );
}

/** Upload / URL picker before an image is set; the image plus caption after. */
function ImageBlock({
  block,
  onSetUrl,
  onCaption,
  onRemove,
}: {
  block: Block;
  onSetUrl: (url: string) => void;
  onCaption: (text: string) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");

  if (!block.url) {
    return (
      <div className="image-picker">
        <button type="button" className="btn small" onClick={() => fileRef.current?.click()}>
          📁 Upload image
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden-input"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) onSetUrl(await fileToDataUri(file));
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
        <button
          type="button"
          className="btn small"
          disabled={!urlInput.trim()}
          onClick={() => onSetUrl(urlInput.trim())}
        >
          Add
        </button>
        <button type="button" className="icon-btn" title="Remove image block" onClick={onRemove}>
          ✕
        </button>
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
        <button type="button" className="icon-btn" title="Remove image" onClick={onRemove}>
          ✕
        </button>
      </div>
    </figure>
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
