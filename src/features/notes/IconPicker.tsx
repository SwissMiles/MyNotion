import React from "react";
import { PAGE_ICONS } from "../../constants";

/** Small popover with the available page icons. */
export function IconPicker({ onPick }: { onPick: (icon: string) => void }) {
  return (
    <div className="card icon-picker">
      {PAGE_ICONS.map((icon) => (
        <button key={icon} className="icon-btn" onClick={() => onPick(icon)}>
          {icon}
        </button>
      ))}
    </div>
  );
}
