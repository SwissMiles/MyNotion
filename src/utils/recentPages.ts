import { readStoredJson, writeStoredJson } from "./storage";

/**
 * Recently opened pages, kept outside AppState so exported backups stay
 * clean. Most recent first, capped at 8.
 */

const RECENTS_KEY = "mynotion-recents-v1";
const MAX_RECENTS = 8;

export function pushRecentPage(id: string): void {
  const current = getRecentPageIds();
  const next = [id, ...current.filter((x) => x !== id)].slice(0, MAX_RECENTS);
  writeStoredJson(RECENTS_KEY, next);
}

export function getRecentPageIds(): string[] {
  const stored = readStoredJson<unknown>(RECENTS_KEY);
  return Array.isArray(stored) ? stored : [];
}
