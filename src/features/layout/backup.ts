import type { AppState } from "../../types";
import { migrateStoredState, serializeState } from "../../store/persistence";

/** Triggers a download of the whole app state as a JSON file. */
export function downloadStateBackup(state: AppState): void {
  const blob = new Blob([JSON.stringify(serializeState(state), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "mynotion-backup.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Parses a backup file, or returns null when it isn't a valid backup.
 * Backups from older app versions are migrated to the current schema.
 */
export async function parseBackupFile(file: File): Promise<AppState | null> {
  try {
    return migrateStoredState(JSON.parse(await file.text()));
  } catch {
    return null;
  }
}
