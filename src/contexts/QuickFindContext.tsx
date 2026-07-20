import React, { createContext, useContext, useMemo, useState } from "react";
import { useWindowEvent } from "../hooks/useWindowEvent";

interface QuickFindContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const QuickFindContext = createContext<QuickFindContextValue | null>(null);

/** Owns the Quick Find open state and its global ⌘K / Ctrl+K (and ⌘P) shortcut. */
export function QuickFindProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useWindowEvent("keydown", (e) => {
    const key = e.key.toLowerCase();
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && (key === "k" || key === "p")) {
      e.preventDefault();
      setIsOpen((open) => !open);
    }
  });

  const value = useMemo<QuickFindContextValue>(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [isOpen],
  );

  return <QuickFindContext.Provider value={value}>{children}</QuickFindContext.Provider>;
}

export function useQuickFind(): QuickFindContextValue {
  const value = useContext(QuickFindContext);
  if (!value) throw new Error("useQuickFind must be used inside <QuickFindProvider>");
  return value;
}
