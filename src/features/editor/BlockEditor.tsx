import React from "react";
import type { Block } from "../../types";
import { BlockRow } from "./BlockRow";
import { useBlockEditor } from "./useBlockEditor";

/** Lightweight Notion-style block editor. Type "/" for the command menu;
 *  see markdownShortcuts.ts for the markdown syntax. */
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
          onText={(text, caret) => editor.handleTextChange(block, index, text, caret)}
          onKey={(event) => editor.handleKeyDown(event, block, index)}
          onToggle={() => editor.toggleChecked(block)}
          onRemove={() => editor.remove(index)}
          slashItems={editor.slash?.blockId === block.id ? editor.slashItems : null}
          slashSelected={editor.slash?.selected ?? 0}
          onSlashHover={editor.setSlashSelected}
          onSlashPick={(itemIndex) => editor.pickSlashItem(itemIndex, block, index)}
          onSlashClose={editor.closeSlash}
        />
      ))}
      <div className="editor-hint">
        Type <b>/</b> for commands — or <b># </b> heading, <b>- </b> bullet, <b>[] </b> to-do,{" "}
        <b>&gt; </b> quote, <b>```</b> code, <b>---</b> divider. ⌥↑/⌥↓ moves a block.
      </div>
    </div>
  );
}
