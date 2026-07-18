import React from "react";
import type { Block } from "../../types";
import { BlockRow } from "./BlockRow";
import { useBlockEditor } from "./useBlockEditor";

/** Lightweight Notion-style block editor. See markdownShortcuts.ts for syntax. */
export function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}) {
  const editor = useBlockEditor(blocks, onChange);

  return (
    <div className="block-editor">
      {editor.list.map((block, index) => (
        <BlockRow
          key={block.id}
          block={block}
          autoFocus={editor.pendingFocusId.current === block.id}
          onFocusDone={() => (editor.pendingFocusId.current = null)}
          onText={(text) => editor.handleTextChange(block, index, text)}
          onKey={(event) => editor.handleKeyDown(event, block, index)}
          onToggle={() => editor.toggleChecked(block)}
          onRemove={() => editor.remove(index)}
        />
      ))}
      <div className="editor-hint">
        Type <b># </b> for heading, <b>- </b> for bullet, <b>[] </b> for to-do, <b>&gt; </b> for quote,{" "}
        <b>```</b> for code, <b>---</b> for divider. ⌥↑/⌥↓ moves a block.
      </div>
    </div>
  );
}
