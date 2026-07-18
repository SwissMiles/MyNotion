import React from "react";
import { cssVars } from "../utils/cssVars";

/** A small colored square, used to mark courses everywhere in the UI. */
export function ColorDot({ color, size = "md" }: { color: string; size?: "sm" | "md" | "lg" }) {
  return <span className={`color-dot color-dot--${size}`} style={cssVars({ "--dot-color": color })} />;
}
