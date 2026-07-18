import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAppState } from "../../store";
import { useTheme } from "../../contexts/ThemeContext";
import { useQuickFind } from "../../contexts/QuickFindContext";
import { buildQuickFindGroups } from "./buildResults";
import { useRunQuickFindAction } from "./useRunQuickFindAction";
import { ResultItem } from "./ResultItem";
import type { QuickFindGroup } from "./types";

/**
 * Quick Find — Notion-style ⌘K / Ctrl+K palette. Fully keyboard-driven:
 * ↑/↓ to move, Enter to open, Esc to close.
 */
export function QuickFind() {
  const state = useAppState();
  const { theme } = useTheme();
  const { close } = useQuickFind();
  const runAction = useRunQuickFindAction();

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(() => buildQuickFindGroups(query, state, theme), [query, state, theme]);
  const sections = useMemo(() => withOffsets(groups), [groups]);
  const flatResults = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const selectedIndex = Math.min(selected, Math.max(0, flatResults.length - 1));

  useEffect(() => inputRef.current?.focus(), []);
  useEffect(() => setSelected(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${selectedIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected(flatResults.length ? (selectedIndex + 1) % flatResults.length : 0);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected(flatResults.length ? (selectedIndex - 1 + flatResults.length) % flatResults.length : 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const result = flatResults[selectedIndex];
      if (result) runAction(result.action);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  return (
    <div className="qf-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="qf-panel" role="dialog" aria-label="Quick Find">
        <div className="qf-input-row">
          <span className="qf-glass">🔍</span>
          <input
            ref={inputRef}
            className="qf-input"
            value={query}
            placeholder="Search pages, tasks, courses… "
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Search"
          />
          <kbd>esc</kbd>
        </div>

        <div className="qf-results" ref={listRef}>
          {flatResults.length === 0 && <div className="qf-empty">No results for “{query}”.</div>}
          {sections.map(({ group, offset }) => (
            <div key={group.label}>
              <div className="qf-section">{group.label}</div>
              {group.items.map((result, i) => {
                const index = offset + i;
                return (
                  <ResultItem
                    key={result.key}
                    result={result}
                    index={index}
                    selected={index === selectedIndex}
                    onHover={() => setSelected(index)}
                    onRun={() => runAction(result.action)}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="qf-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
          <span className="spacer" />
          <span>searches all semesters</span>
        </div>
      </div>
    </div>
  );
}

/** Pairs each group with the flat index of its first item, for keyboard selection. */
function withOffsets(groups: QuickFindGroup[]): { group: QuickFindGroup; offset: number }[] {
  let offset = 0;
  return groups.map((group) => {
    const section = { group, offset };
    offset += group.items.length;
    return section;
  });
}
