import type { BlockType } from "../../types";

/**
 * Markdown shortcuts typed at the start of a text block:
 *   "# "  → heading 1     "## " → heading 2
 *   "- "  → bullet        "[] " → to-do
 *   "> "  → quote         "```" → code
 *   "---" → divider
 */

const PREFIX_SHORTCUTS: [prefix: string, type: BlockType][] = [
  ["# ", "h1"],
  ["## ", "h2"],
  ["- ", "bullet"],
  ["[] ", "todo"],
  ["> ", "quote"],
  ["```", "code"],
];

export type MarkdownShortcut =
  | { kind: "convert"; type: BlockType; text: string }
  | { kind: "divider" };

export function matchMarkdownShortcut(raw: string): MarkdownShortcut | null {
  for (const [prefix, type] of PREFIX_SHORTCUTS) {
    if (raw.startsWith(prefix)) return { kind: "convert", type, text: raw.slice(prefix.length) };
  }
  if (raw === "---") return { kind: "divider" };
  return null;
}
