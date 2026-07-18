import type { ID } from "../types";

/** Collision-safe enough for local-only data: random slug + timestamp. */
export function uid(): ID {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
