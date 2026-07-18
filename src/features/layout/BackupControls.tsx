import React, { useRef } from "react";
import { useAppState, useDispatch } from "../../store";
import { downloadStateBackup, parseBackupFile } from "./backup";

/** Export / import buttons in the sidebar footer. */
export function BackupControls() {
  const state = useAppState();
  const dispatch = useDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function importFile(file: File) {
    const imported = await parseBackupFile(file);
    if (imported) dispatch({ type: "importState", state: imported });
    else alert("That file doesn't look like a MyNotion backup.");
  }

  return (
    <div className="sidebar-foot">
      <button className="btn small ghost" onClick={() => downloadStateBackup(state)}>
        ⬇ Export
      </button>
      <button className="btn small ghost" onClick={() => fileInputRef.current?.click()}>
        ⬆ Import
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void importFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
