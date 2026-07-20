import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ID } from "../types";
import { uid } from "../utils/id";
import { useAppState, useDispatch } from "../store";

export type FocusPhase = "focus" | "break";

export interface FocusPreset {
  label: string;
  focusMinutes: number;
  breakMinutes: number;
}

export const FOCUS_PRESETS: FocusPreset[] = [
  { label: "15 / 3", focusMinutes: 15, breakMinutes: 3 },
  { label: "25 / 5", focusMinutes: 25, breakMinutes: 5 },
  { label: "50 / 10", focusMinutes: 50, breakMinutes: 10 },
];

interface FocusContextValue {
  phase: FocusPhase;
  running: boolean;
  /** Seconds left in the current phase (full phase length when idle). */
  secondsLeft: number;
  /** True once a phase has been started and not yet finished/abandoned. */
  active: boolean;
  courseId: ID | null;
  preset: FocusPreset;
  completedToday: number;
  setCourseId: (id: ID | null) => void;
  setPreset: (preset: FocusPreset) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  /** Log the elapsed focus time (if ≥ 1 min) and reset. */
  finishEarly: () => void;
  /** Discard the current phase without logging. */
  abandon: () => void;
  skipBreak: () => void;
}

const FocusContext = createContext<FocusContextValue | null>(null);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch();
  const state = useAppState();
  const [phase, setPhase] = useState<FocusPhase>("focus");
  const [preset, setPresetState] = useState<FocusPreset>(FOCUS_PRESETS[1]);
  const [courseId, setCourseId] = useState<ID | null>(null);
  const [running, setRunning] = useState(false);
  const [active, setActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(preset.focusMinutes * 60);
  const [completedToday, setCompletedToday] = useState(0);
  const startedAtRef = useRef<string>("");
  // Wall-clock deadline while running, so a backgrounded tab stays accurate.
  const endsAtRef = useRef<number>(0);

  const phaseSeconds = (p: FocusPhase) =>
    (p === "focus" ? preset.focusMinutes : preset.breakMinutes) * 60;

  function logFocusMinutes(minutes: number) {
    if (minutes < 1 || !state.activeSemesterId) return;
    dispatch({
      type: "addSession",
      session: {
        id: uid(),
        courseId,
        semesterId: state.activeSemesterId,
        startedAt: startedAtRef.current || new Date().toISOString(),
        minutes,
      },
    });
  }

  function resetTo(nextPhase: FocusPhase) {
    setPhase(nextPhase);
    setRunning(false);
    setActive(false);
    setSecondsLeft((nextPhase === "focus" ? preset.focusMinutes : preset.breakMinutes) * 60);
  }

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.round((endsAtRef.current - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        window.clearInterval(timer);
        setRunning(false);
        setActive(false);
        if (phase === "focus") {
          logFocusMinutes(preset.focusMinutes);
          setCompletedToday((n) => n + 1);
          setPhase("break");
          setSecondsLeft(preset.breakMinutes * 60);
        } else {
          setPhase("focus");
          setSecondsLeft(preset.focusMinutes * 60);
        }
      }
    }, 500);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, preset, courseId, state.activeSemesterId]);

  const value = useMemo<FocusContextValue>(
    () => ({
      phase,
      running,
      secondsLeft,
      active,
      courseId,
      preset,
      completedToday,
      setCourseId,
      setPreset: (next) => {
        setPresetState(next);
        if (!active) {
          setSecondsLeft((phase === "focus" ? next.focusMinutes : next.breakMinutes) * 60);
        }
      },
      start: () => {
        startedAtRef.current = new Date().toISOString();
        endsAtRef.current = Date.now() + phaseSeconds(phase) * 1000;
        setSecondsLeft(phaseSeconds(phase));
        setActive(true);
        setRunning(true);
      },
      pause: () => setRunning(false),
      resume: () => {
        endsAtRef.current = Date.now() + secondsLeft * 1000;
        setRunning(true);
      },
      finishEarly: () => {
        if (phase === "focus") {
          const elapsed = phaseSeconds("focus") - secondsLeft;
          logFocusMinutes(Math.round(elapsed / 60));
        }
        resetTo(phase === "focus" ? "break" : "focus");
      },
      abandon: () => resetTo("focus"),
      skipBreak: () => resetTo("focus"),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase, running, secondsLeft, active, courseId, preset, completedToday, state.activeSemesterId],
  );

  // The tab title is owned by useDocumentTitle, which shows the countdown
  // while the timer runs.

  return <FocusContext.Provider value={value}>{children}</FocusContext.Provider>;
}

export function useFocus(): FocusContextValue {
  const value = useContext(FocusContext);
  if (!value) throw new Error("useFocus must be used inside <FocusProvider>");
  return value;
}

/** 1490 → "24:50" */
export function fmtClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
