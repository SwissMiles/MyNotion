/** Pure text-matching helpers for Quick Find. */

export interface MatchRange {
  start: number;
  len: number;
}

export function mergeRanges(ranges: MatchRange[]): MatchRange[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: MatchRange[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.start + last.len) {
      last.len = Math.max(last.len, range.start + range.len - last.start);
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}

/** Every query word must appear in the text; earlier / word-start hits score higher. */
export function matchText(
  text: string,
  words: string[],
): { score: number; ranges: MatchRange[] } | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  let score = 0;
  const ranges: MatchRange[] = [];
  for (const word of words) {
    const index = lower.indexOf(word);
    if (index === -1) return null;
    if (index === 0) score += 40;
    else if (!/[\p{L}\p{N}]/u.test(lower[index - 1])) score += 25; // starts a word
    else score += 8;
    ranges.push({ start: index, len: word.length });
  }
  if (words.length > 1 && lower.includes(words.join(" "))) score += 15;
  score += Math.max(0, 12 - Math.floor(text.length / 12)); // shorter text ranks a touch higher
  return { score, ranges: mergeRanges(ranges) };
}

export interface Snippet {
  text: string;
  ranges: MatchRange[];
}

/** Trim long matched text to a window around the first hit, shifting highlight ranges. */
export function makeSnippet(text: string, ranges: MatchRange[]): Snippet {
  const MAX = 100;
  if (text.length <= MAX || ranges.length === 0) return { text, ranges };
  let start = Math.max(0, ranges[0].start - 32);
  if (start > 0) {
    const space = text.indexOf(" ", start);
    if (space !== -1 && space < ranges[0].start) start = space + 1;
  }
  const end = Math.min(text.length, start + MAX);
  const prefix = start > 0 ? "…" : "";
  const sliced = prefix + text.slice(start, end) + (end < text.length ? "…" : "");
  const shifted = ranges
    .filter((r) => r.start >= start && r.start < end)
    .map((r) => ({ start: r.start - start + prefix.length, len: Math.min(r.len, end - r.start) }));
  return { text: sliced, ranges: shifted };
}
