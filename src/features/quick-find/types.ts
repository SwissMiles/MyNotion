import type { View } from "../../contexts/NavigationContext";
import type { DueTone } from "../../utils/tasks";
import type { MatchRange, Snippet } from "./search";

export interface ResultTag {
  label: string;
  color?: string; // course color dot
  tone?: DueTone;
}

/** What selecting a result should do — interpreted by useRunQuickFindAction. */
export type QuickFindAction =
  | { type: "navigate"; semesterId: string | null; view: View }
  | { type: "create-page"; title: string }
  | { type: "toggle-theme" };

export interface QuickFindResult {
  key: string;
  icon: string;
  title: string;
  titleRanges?: MatchRange[];
  snippet?: Snippet;
  tags?: ResultTag[];
  score: number;
  action: QuickFindAction;
}

export interface QuickFindGroup {
  label: string;
  items: QuickFindResult[];
}
