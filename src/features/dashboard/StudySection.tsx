import React from "react";
import { isoDate } from "../../utils/date";
import { dueCards } from "../../utils/srs";
import { fmtMinutes, sessionsOnDay, totalMinutes } from "../../utils/studySessions";
import { useActiveSemester } from "../../store";
import { useNavigation } from "../../contexts/NavigationContext";

/** Nudges toward the day's studying: due flashcards and focus time so far. */
export function StudySection() {
  const { flashcards, sessions } = useActiveSemester();
  const { navigate } = useNavigation();
  const dueCardCount = dueCards(flashcards).length;
  const minutesToday = totalMinutes(sessionsOnDay(sessions, isoDate()));

  return (
    <div>
      <div className="section-title">🧠 Studying</div>
      <div className="card study-section">
        <button className="study-nudge" onClick={() => navigate({ kind: "flashcards" })}>
          <span className="study-nudge-icon">🃏</span>
          <span className="study-nudge-text">
            {dueCardCount > 0 ? (
              <><b>{dueCardCount}</b> flashcard{dueCardCount === 1 ? "" : "s"} due for review</>
            ) : (
              "All flashcards reviewed 🎉"
            )}
          </span>
        </button>
        <button className="study-nudge" onClick={() => navigate({ kind: "focus" })}>
          <span className="study-nudge-icon">⏱️</span>
          <span className="study-nudge-text">
            {minutesToday > 0 ? (
              <><b>{fmtMinutes(minutesToday)}</b> of focused studying today</>
            ) : (
              "No focus session yet today — start one"
            )}
          </span>
        </button>
      </div>
    </div>
  );
}
