import React from "react";
import { useNavigation } from "../../contexts/NavigationContext";
import { useActiveSemester } from "../../store";
import { dueCards } from "../../utils/srs";
import { isoDateLocal } from "../../utils/date";
import { fmtMinutes, sessionsOnDay, totalMinutes } from "../../utils/sessions";

/** Small dashboard nudge: cards waiting for review and focus time logged today. */
export function StudySection() {
  const { navigate } = useNavigation();
  const { flashcards, sessions } = useActiveSemester();

  const due = dueCards(flashcards).length;
  const minutesToday = totalMinutes(sessionsOnDay(sessions, isoDateLocal()));

  return (
    <>
      <h2 className="section-title"><span className="section-title-label">🧠 Studying</span></h2>
      <div className="card study-section">
        <button className="study-nudge" onClick={() => navigate({ kind: "flashcards" })}>
          <span className="study-nudge-icon">🃏</span>
          <span className="study-nudge-text">
            {due > 0 ? (
              <>
                <b>{due}</b> flashcard{due === 1 ? "" : "s"} due for review
              </>
            ) : (
              "All flashcards reviewed 🎉"
            )}
          </span>
        </button>
        <button className="study-nudge" onClick={() => navigate({ kind: "focus" })}>
          <span className="study-nudge-icon">⏱️</span>
          <span className="study-nudge-text">
            {minutesToday > 0 ? (
              <>
                <b>{fmtMinutes(minutesToday)}</b> of focused studying today
              </>
            ) : (
              "No focus session yet today — start one"
            )}
          </span>
        </button>
      </div>
    </>
  );
}
