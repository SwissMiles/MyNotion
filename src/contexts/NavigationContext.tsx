import React, { createContext, useContext, useMemo, useState } from "react";
import type { ID } from "../types";

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

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<View>({ kind: "dashboard" });
  const [returnView, setReturnView] = useState<View>({ kind: "notes" });

  const value = useMemo<NavigationContextValue>(
    () => ({
      view,
      navigate: (next: View) => {
        if (next.kind !== "page") setReturnView(next);
        setView(next);
      },
      goBack: () => setView(returnView),
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
