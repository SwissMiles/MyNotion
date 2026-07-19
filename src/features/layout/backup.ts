import type { AppState } from "../../types";
import { withStateDefaults } from "../../store/persistence";

/** Triggers a download of the whole app state as a JSON file. */
export function downloadStateBackup(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "mynotion-backup.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Parses a backup file, or returns null when it isn't a valid backup. */
export async function parseBackupFile(file: File): Promise<AppState | null> {
  try {
    const parsed = JSON.parse(await file.text());
    if (!parsed || !Array.isArray(parsed.semesters)) return null;
    return withStateDefaults(parsed as AppState);
  } catch {
    return null;
  }
}
