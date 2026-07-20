import type { Block } from "../../types";

const isList = (b: Block) => b.type === "bullet" || b.type === "todo" || b.type === "numbered";

/** Serialize a note page to plain Markdown for export. */
export function blocksToMarkdown(title: string, blocks: Block[]): string {
  // drop trailing empty blocks so the file doesn't end in blank paragraphs
  while (
    blocks.length > 0 &&
    blocks[blocks.length - 1].type === "text" &&
    blocks[blocks.length - 1].text === ""
  ) {
    blocks = blocks.slice(0, -1);
  }
  let body = "";
  let numbered = 0;
  blocks.forEach((b, i) => {
    const indent = "  ".repeat(b.indent ?? 0);
    numbered = b.type === "numbered" ? numbered + 1 : 0;
    let line: string;
    switch (b.type) {
      case "h1": line = `# ${b.text}`; break;
      case "h2": line = `## ${b.text}`; break;
      case "h3": line = `### ${b.text}`; break;
      case "bullet": line = `${indent}- ${b.text}`; break;
      case "numbered": line = `${indent}${numbered}. ${b.text}`; break;
      case "todo": line = `${indent}- [${b.checked ? "x" : " "}] ${b.text}`; break;
      case "quote": line = `> ${b.text}`; break;
      case "callout": line = `> 💡 ${b.text}`; break;
      case "code": line = "```\n" + b.text + "\n```"; break;
      case "divider": line = "---"; break;
      case "image": line = `![${b.text}](${b.url ?? ""})`; break;
      default: line = b.text;
    }
    // adjacent list items stay in one list; everything else gets a blank line
    const sep = i === 0 ? "" : isList(b) && isList(blocks[i - 1]) ? "\n" : "\n\n";
    body += sep + line;
  });
  return `# ${title || "Untitled"}\n\n${body}\n`;
}
