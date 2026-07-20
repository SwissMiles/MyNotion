import type { BlockType } from "../../types";

/**
 * The "/" command menu: typing "/" in a block opens a filterable list of
 * block types. Items are matched against the text typed after the slash.
 */

export interface SlashItem {
  type: BlockType;
  title: string;
  description: string;
  icon: string;
  keywords: string[];
}

export const SLASH_ITEMS: SlashItem[] = [
  { type: "text", title: "Text", description: "Plain paragraph", icon: "Aa", keywords: ["text", "plain", "paragraph"] },
  { type: "h1", title: "Heading 1", description: "Big section heading", icon: "H1", keywords: ["heading", "h1", "title", "big"] },
  { type: "h2", title: "Heading 2", description: "Medium section heading", icon: "H2", keywords: ["heading", "h2", "subheading", "medium"] },
  { type: "h3", title: "Heading 3", description: "Small section heading", icon: "H3", keywords: ["heading", "h3", "small"] },
  { type: "bullet", title: "Bulleted list", description: "Simple bulleted list", icon: "•", keywords: ["bullet", "list", "unordered", "ul"] },
  { type: "numbered", title: "Numbered list", description: "List with numbering", icon: "1.", keywords: ["numbered", "ordered", "list", "ol"] },
  { type: "todo", title: "To-do list", description: "Track tasks with checkboxes", icon: "☐", keywords: ["todo", "to-do", "task", "checkbox", "check"] },
  { type: "quote", title: "Quote", description: "Capture a quote", icon: "❝", keywords: ["quote", "blockquote", "citation"] },
  { type: "callout", title: "Callout", description: "Make writing stand out", icon: "💡", keywords: ["callout", "highlight", "info", "note"] },
  { type: "code", title: "Code", description: "Monospaced code snippet", icon: "</>", keywords: ["code", "snippet", "monospace"] },
  { type: "image", title: "Image", description: "Upload or embed an image", icon: "🖼", keywords: ["image", "picture", "photo", "img", "upload"] },
  { type: "divider", title: "Divider", description: "Visually divide blocks", icon: "—", keywords: ["divider", "separator", "hr", "line", "rule"] },
];

/** Items whose title or keywords match the query (case-insensitive). */
export function filterSlashItems(query: string): SlashItem[] {
  const q = query.trim().toLowerCase();
  if (q === "") return SLASH_ITEMS;
  return SLASH_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(q) || item.keywords.some((k) => k.startsWith(q)),
  );
}
