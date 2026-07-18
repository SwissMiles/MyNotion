/**
 * localStorage helpers that never throw — storage can be unavailable
 * (private mode, quota) or hold corrupt JSON, and callers should just
 * get `null` back in those cases.
 */

export function readStoredString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStoredString(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // storage unavailable — persistence is best-effort
  }
}

export function readStoredJson<T>(key: string): T | null {
  const raw = readStoredString(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeStoredJson(key: string, value: unknown): void {
  writeStoredString(key, JSON.stringify(value));
}
