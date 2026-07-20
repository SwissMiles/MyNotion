import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AppState } from "../types";
import type { Action } from "../store";
import { useAppState, useDispatch } from "../store";

/** How long the Undo toast stays on screen. */
const UNDO_TOAST_MS = 6000;

interface UndoContextValue {
  /**
   * Dispatches a destructive action and shows an Undo toast. Undoing restores
   * the full pre-action state, so edits made during the toast's few seconds
   * are rolled back too — an acceptable trade for delete recovery.
   */
  dispatchUndoable: (label: string, action: Action) => void;
}

const UndoContext = createContext<UndoContextValue | null>(null);

export function UndoProvider({ children }: { children: React.ReactNode }) {
  const state = useAppState();
  const dispatch = useDispatch();
  const [toast, setToast] = useState<{ label: string; snapshot: AppState } | null>(null);
  const timer = useRef<number | null>(null);

  // Read state through a ref so dispatchUndoable can stay referentially stable.
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (!toast) return;
    timer.current = window.setTimeout(() => setToast(null), UNDO_TOAST_MS);
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, [toast]);

  const value = useMemo<UndoContextValue>(
    () => ({
      dispatchUndoable: (label, action) => {
        const snapshot = stateRef.current;
        dispatch(action);
        setToast({ label, snapshot });
      },
    }),
    [dispatch],
  );

  function undo() {
    if (!toast) return;
    dispatch({ type: "importState", state: toast.snapshot });
    setToast(null);
  }

  return (
    <UndoContext.Provider value={value}>
      {children}
      {toast && (
        <div className="undo-toast" role="status">
          <span className="undo-toast-label">{toast.label}</span>
          <button className="undo-toast-btn" onClick={undo}>
            Undo
          </button>
          <button className="undo-toast-close" onClick={() => setToast(null)} aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}
    </UndoContext.Provider>
  );
}

export function useUndoableDispatch(): UndoContextValue["dispatchUndoable"] {
  const value = useContext(UndoContext);
  if (!value) throw new Error("useUndoableDispatch must be used inside <UndoProvider>");
  return value.dispatchUndoable;
}
