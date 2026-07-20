import React from "react";
import type { MatchRange } from "./search";

/** Text with the matched ranges wrapped in <mark>. */
export function Highlight({ text, ranges }: { text: string; ranges?: MatchRange[] }) {
  if (!ranges || ranges.length === 0) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let pos = 0;
  ranges.forEach((range, i) => {
    if (range.start > pos) parts.push(text.slice(pos, range.start));
    parts.push(<mark key={i}>{text.slice(range.start, range.start + range.len)}</mark>);
    pos = range.start + range.len;
  });
  if (pos < text.length) parts.push(text.slice(pos));
  return <>{parts}</>;
}
