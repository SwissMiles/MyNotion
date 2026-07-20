import { useState } from "react";

/**
 * Object-backed form state with a typed per-field setter, so modals don't
 * need one useState per input.
 */
export function useFormState<T extends object>(initial: T) {
  const [values, setValues] = useState<T>(initial);

  function setField<K extends keyof T>(field: K, value: T[K]): void {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  return { values, setField, setValues };
}
