import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * Keeps --vvh in sync with the visual viewport so overlays can size themselves
 * to the space that remains above the on-screen keyboard.
 */
function useVisualViewportVar() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
    update();
    vv.addEventListener("resize", update);
    return () => {
      vv.removeEventListener("resize", update);
      document.documentElement.style.removeProperty("--vvh");
    };
  }, []);
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useVisualViewportVar();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  // once the keyboard has opened, make sure the focused field is visible inside the sheet
  function onFocusCapture(e: React.FocusEvent) {
    const t = e.target as HTMLElement;
    if (t.matches?.("input, textarea, select")) {
      setTimeout(() => t.scrollIntoView({ block: "center", behavior: "smooth" }), 200);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onFocusCapture={onFocusCapture}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="form-row">
      <label>{label}</label>
      {children}
    </div>
  );
}

/** Shown on any page that needs an active semester but none exists yet. */
export function NoSemesterNotice({
  message,
  onCreateSemester,
}: {
  message: string;
  onCreateSemester: () => void;
}) {
  return (
    <div className="page-wrap">
      <div className="empty empty--action">
        <p>{message}</p>
        <button className="btn primary" onClick={onCreateSemester}>+ Create a semester</button>
      </div>
    </div>
  );
}

/* ---------- Toasts ---------- */

type ToastAction = { label: string; run: () => void };
type ToastItem = { id: number; text: string; action?: ToastAction };
export type ShowToast = (text: string, action?: ToastAction) => void;

const ToastCtx = createContext<ShowToast>(() => {});

export function useToast(): ShowToast {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback<ShowToast>((text, action) => {
    const id = ++idRef.current;
    setToasts((ts) => [...ts.slice(-2), { id, text, action }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 5000);
  }, []);

  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span className="toast-text">{t.text}</span>
            {t.action && (
              <button
                className="toast-action"
                onClick={() => {
                  t.action!.run();
                  setToasts((ts) => ts.filter((x) => x.id !== t.id));
                }}
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
