import React, { useState } from "react";
import type { Course, Flashcard } from "../../types";
import { dueCards } from "../../utils/srs";
import { fmtDate } from "../../utils/date";
import { useActiveSemester } from "../../store";
import { ColorDot } from "../../components/ColorDot";
import { CardModal } from "./CardModal";
import { StudyMode } from "./StudyMode";

export function FlashcardsView() {
  const { semester, courses, flashcards } = useActiveSemester();
  const [studyCards, setStudyCards] = useState<Flashcard[] | null>(null);
  const [modal, setModal] = useState<{ card: Flashcard | null; defaultCourseId?: string | null } | null>(null);
  const [expandedDeck, setExpandedDeck] = useState<string | null>(null);

  if (!semester) return null;

  const due = dueCards(flashcards);

  if (studyCards) {
    return (
      <div className="page-wrap">
        <StudyMode initialCards={studyCards} onExit={() => setStudyCards(null)} />
      </div>
    );
  }

  // General deck first, then one deck per course (even when still empty).
  const decks: { key: string; courseId: string | null; name: string; course: Course | null }[] = [
    { key: "general", courseId: null, name: "General", course: null },
    ...courses.map((c) => ({ key: c.id, courseId: c.id as string | null, name: c.name, course: c as Course | null })),
  ];

  function startStudy(cards: Flashcard[]) {
    if (cards.length === 0) return;
    setStudyCards(shuffle(cards));
  }

  return (
    <div className="page-wrap">
      <h1 className="page-title">🃏 Flashcards</h1>
      <p className="page-sub">
        Spaced repetition, one deck per course. Cards you find hard come back sooner.
      </p>

      <div className="stat-row stat-row--3">
        <div className="stat">
          <div className="num">{flashcards.length}</div>
          <div className="cap">{flashcards.length === 1 ? "card" : "cards"} total</div>
        </div>
        <div className="stat">
          <div className="num">{due.length}</div>
          <div className="cap">due for review</div>
        </div>
        <div className="stat stat--action">
          <button
            className="btn primary"
            disabled={due.length === 0}
            onClick={() => startStudy(due)}
          >
            ▶ Study all due
          </button>
        </div>
      </div>

      {flashcards.length === 0 && (
        <div className="empty empty--spaced">
          No flashcards yet. Add cards to a course deck below — a few cards after each
          lecture beats cramming before the exam.
        </div>
      )}

      {decks.map((deck) => {
        const deckCards = flashcards.filter((c) => c.courseId === deck.courseId);
        if (deck.courseId === null && deckCards.length === 0 && courses.length > 0) {
          // Hide an empty General deck once real course decks exist.
          return null;
        }
        const deckDue = dueCards(deckCards);
        const expanded = expandedDeck === deck.key;
        return (
          <div key={deck.key} className="card deck-card">
            <div className="deck-row" onClick={() => setExpandedDeck(expanded ? null : deck.key)}>
              <ColorDot color={deck.course?.color ?? "var(--text-3)"} size="lg" />
              <span className="deck-name">{deck.name}</span>
              <span className="muted">
                {deckCards.length} {deckCards.length === 1 ? "card" : "cards"}
              </span>
              {deckDue.length > 0 && <span className="pill soon">{deckDue.length} due</span>}
              <span className="spacer" />
              <button
                className="btn small"
                onClick={(e) => {
                  e.stopPropagation();
                  setModal({ card: null, defaultCourseId: deck.courseId });
                }}
              >
                + Add
              </button>
              <button
                className="btn primary small"
                disabled={deckDue.length === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  startStudy(deckDue);
                }}
              >
                Study
              </button>
              <span className="deck-chevron">{expanded ? "▾" : "▸"}</span>
            </div>
            {expanded && (
              <div className="deck-cards">
                {deckCards.length === 0 && <div className="muted deck-empty">No cards in this deck yet.</div>}
                {deckCards.map((card) => (
                  <button key={card.id} className="deck-card-row" onClick={() => setModal({ card })}>
                    <span className="deck-card-front">{card.front}</span>
                    <span className="muted">
                      {card.reps > 0 ? `due ${fmtDate(card.due)}` : "new"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {modal && (
        <CardModal
          card={modal.card}
          defaultCourseId={modal.defaultCourseId}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
