export const IS_MAC = /Mac|iPhone|iPad/.test(
  typeof navigator !== "undefined" ? navigator.platform || navigator.userAgent : "",
);

export const SEARCH_SHORTCUT = IS_MAC ? "⌘K" : "Ctrl K";
