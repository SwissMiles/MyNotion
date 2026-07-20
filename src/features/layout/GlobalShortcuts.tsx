import React, { useRef, useState } from "react";
import type { StaticViewKind } from "../../contexts/NavigationContext";
import { useNavigation } from "../../contexts/NavigationContext";
import { useWindowEvent } from "../../hooks/useWindowEvent";
import { SEARCH_SHORTCUT } from "../quick-find/platform";
import { Modal } from "../../components/Modal";

/** Second key of a "g then …" chord → the view it jumps to. */
const GO_SHORTCUTS: Record<string, StaticViewKind> = {
  d: "dashboard",
  t: "tasks",
  c: "calendar",
  w: "timetable",
  f: "flashcards",
  o: "focus",
  g: "grades",
  n: "notes",
};

/** How long after pressing "g" the second key of the chord may follow. */
const CHORD_MS = 1200;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

/**
 * Global single-key shortcuts: "?" opens the cheat sheet, "g then <key>"
 * jumps between views. Inactive while typing in any field or the editor.
 */
export function GlobalShortcuts() {
  const { navigate } = useNavigation();
  const [helpOpen, setHelpOpen] = useState(false);
  const chordUntil = useRef(0);

  useWindowEvent("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;

    if (e.key === "?") {
      e.preventDefault();
      setHelpOpen((open) => !open);
      return;
    }

    const chordActive = Date.now() < chordUntil.current;
    chordUntil.current = 0;
    if (chordActive) {
      const kind = GO_SHORTCUTS[e.key.toLowerCase()];
      if (kind) {
        e.preventDefault();
        setHelpOpen(false);
        navigate({ kind });
      }
      return;
    }
    if (e.key.toLowerCase() === "g" && !e.shiftKey) {
      chordUntil.current = Date.now() + CHORD_MS;
    }
  });

  if (!helpOpen) return null;
  return <ShortcutsHelp onClose={() => setHelpOpen(false)} />;
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div className="shortcut-row">
      <span className="shortcut-keys">
        {keys.map((key) => (
          <kbd key={key}>{key}</kbd>
        ))}
      </span>
      <span>{label}</span>
    </div>
  );
}

export function ShortcutsHelp({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Keyboard shortcuts" onClose={onClose}>
      <div className="shortcut-section">Anywhere</div>
      <ShortcutRow keys={[SEARCH_SHORTCUT]} label="Quick Find — search everything" />
      <ShortcutRow keys={["?"]} label="Show / hide this cheat sheet" />
      <ShortcutRow keys={["esc"]} label="Close dialogs and menus" />

      <div className="shortcut-section">Go to (press g, then…)</div>
      <div className="shortcut-grid">
        <ShortcutRow keys={["g", "d"]} label="Dashboard" />
        <ShortcutRow keys={["g", "t"]} label="Assignments & Exams" />
        <ShortcutRow keys={["g", "c"]} label="Calendar" />
        <ShortcutRow keys={["g", "w"]} label="Timetable" />
        <ShortcutRow keys={["g", "f"]} label="Flashcards" />
        <ShortcutRow keys={["g", "o"]} label="Focus timer" />
        <ShortcutRow keys={["g", "g"]} label="Grades" />
        <ShortcutRow keys={["g", "n"]} label="All notes" />
      </div>

      <div className="shortcut-section">In the note editor</div>
      <ShortcutRow keys={["/"]} label="Open the block menu" />
      <ShortcutRow keys={["[[", "]]"]} label="Link to another page" />
      <ShortcutRow keys={["Tab"]} label="Indent list items (Shift-Tab to outdent)" />

      <div className="modal-actions">
        <span className="spacer" />
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
