import type { CSSProperties } from "react";

/**
 * Typed bridge for passing dynamic values (colors, sizes) to CSS custom
 * properties, so components never carry visual styling inline — the
 * actual styling lives in the stylesheet.
 */
export function cssVars(vars: Record<`--${string}`, string | number>): CSSProperties {
  return vars as CSSProperties;
}
