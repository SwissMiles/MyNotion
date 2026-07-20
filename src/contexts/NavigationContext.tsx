import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AppState, ID } from "../types";
import { useAppState } from "../store";
import { readStoredJson, writeStoredJson } from "../utils/storage";
import { useWindowEvent } from "../hooks/useWindowEvent";

export type CourseTab = "notes" | "tasks" | "grades" | "info";

/** Top-level views that carry no parameters. */
export type StaticViewKind =
  | "dashboard"
  | "tasks"
  | "calendar"
  | "timetable"
  | "flashcards"
  | "focus"
  | "grades"
  | "notes";

export type View =
  | { kind: StaticViewKind }
  | { kind: "course"; courseId: ID; tab?: CourseTab }
  | { kind: "page"; pageId: ID };

interface NavigationContextValue {
  view: View;
  navigate: (view: View) => void;
  /** Return from a page to the list view the user came from. */
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

const VIEW_STORAGE_KEY = "mynotion-last-view";

const STATIC_VIEW_KINDS: ReadonlySet<string> = new Set<StaticViewKind>([
  "dashboard", "tasks", "calendar", "timetable", "flashcards", "focus", "grades", "notes",
]);

/**
 * Checks that a view restored from localStorage or the history stack still
 * points at something real (the page/course may have been deleted since).
 */
function validateView(raw: unknown, state: AppState): View | null {
  if (!raw || typeof raw !== "object") return null;
  const view = raw as View;
  if (view.kind === "page") {
    return state.pages.some((p) => p.id === view.pageId) ? { kind: "page", pageId: view.pageId } : null;
  }
  if (view.kind === "course") {
    return state.courses.some((c) => c.id === view.courseId)
      ? { kind: "course", courseId: view.courseId, tab: view.tab }
      : null;
  }
  return STATIC_VIEW_KINDS.has(view.kind) ? { kind: view.kind } : null;
}

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const state = useAppState();
  const [view, setView] = useState<View>(
    () => validateView(readStoredJson<View>(VIEW_STORAGE_KEY), state) ?? { kind: "dashboard" },
  );
  const [returnView, setReturnView] = useState<View>({ kind: "notes" });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Remember where the user is, so a reload brings them back to the same view.
  useEffect(() => {
    writeStoredJson(VIEW_STORAGE_KEY, view);
  }, [view]);

  // Stamp the initial history entry so back/forward can restore it later.
  const initialView = useRef(view);
  useEffect(() => {
    if (!window.history.state?.myNotionView) {
      window.history.replaceState({ myNotionView: initialView.current }, "");
    }
  }, []);

  // Browser / Android hardware back walks the in-app view stack.
  useWindowEvent("popstate", (e) => {
    const restored = validateView(e.state?.myNotionView, stateRef.current);
    setView(restored ?? { kind: "dashboard" });
  });

  const value = useMemo<NavigationContextValue>(
    () => ({
      view,
      navigate: (next: View) => {
        if (next.kind !== "page") setReturnView(next);
        window.history.pushState({ myNotionView: next }, "");
        setView(next);
      },
      goBack: () => {
        window.history.pushState({ myNotionView: returnView }, "");
        setView(returnView);
      },
    }),
    [view, returnView],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigation(): NavigationContextValue {
  const value = useContext(NavigationContext);
  if (!value) throw new Error("useNavigation must be used inside <NavigationProvider>");
  return value;
}
