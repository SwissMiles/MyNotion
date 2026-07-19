import React, { useEffect, useMemo, useState } from "react";
import { uid, useActiveSemester, useDispatch } from "../store";
import type { Course, Flashcard, ReviewRating } from "../types";
import { fmtDate } from "../lib";
import { dueCards, newCardScheduling, previewInterval } from "../srs";
import { Field, Modal } from "../components/ui";

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
          <button className="btn primary" disabled={due.length === 0} onClick={() => startStudy(due)}>
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
              <span className="dot deck-dot" style={{ background: deck.course?.color ?? "var(--text-3)" }} />
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

function CardModal({
  card,
  defaultCourseId,
  onClose,
}: {
  card: Flashcard | null;
  defaultCourseId?: string | null;
  onClose: () => void;
}) {
  const dispatch = useDispatch();
  const { semester, courses } = useActiveSemester();
  const [front, setFront] = useState(card?.front ?? "");
  const [back, setBack] = useState(card?.back ?? "");
  const [courseId, setCourseId] = useState(card?.courseId ?? defaultCourseId ?? "");

  if (!semester) return null;

  function save(addAnother: boolean) {
    if (!front.trim() || !semester) return;
    const saved: Flashcard = {
      ...(card ?? { id: uid(), semesterId: semester.id, ...newCardScheduling() }),
      courseId: courseId || null,
      front: front.trim(),
      back: back.trim(),
    };
    dispatch(card ? { type: "updateFlashcard", card: saved } : { type: "addFlashcard", card: saved });
    if (addAnother && !card) {
      setFront("");
      setBack("");
    } else {
      onClose();
    }
  }

  return (
    <Modal title={card ? "Edit card" : "New flashcard"} onClose={onClose}>
      <Field label="Front (question)">
        <textarea
          rows={2}
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="What does Big-O notation describe?"
          autoFocus
        />
      </Field>
      <Field label="Back (answer)">
        <textarea
          rows={3}
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder="The upper bound of an algorithm's growth rate…"
        />
      </Field>
      <Field label="Deck">
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">— General —</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{course.code || course.name}</option>
          ))}
        </select>
      </Field>

      <div className="modal-actions">
        {card && (
          <button
            className="btn danger"
            onClick={() => {
              dispatch({ type: "deleteFlashcard", id: card.id });
              onClose();
            }}
          >
            Delete
          </button>
        )}
        <span className="spacer" />
        <button className="btn" onClick={onClose}>Cancel</button>
        {!card && (
          <button className="btn" onClick={() => save(true)} disabled={!front.trim()}>
            Add & next
          </button>
        )}
        <button className="btn primary" onClick={() => save(false)} disabled={!front.trim()}>
          {card ? "Save" : "Add card"}
        </button>
      </div>
    </Modal>
  );
}

const RATINGS: { rating: ReviewRating; label: string; key: string; className: string }[] = [
  { rating: "again", label: "Again", key: "1", className: "study-btn--again" },
  { rating: "hard", label: "Hard", key: "2", className: "study-btn--hard" },
  { rating: "good", label: "Good", key: "3", className: "study-btn--good" },
  { rating: "easy", label: "Easy", key: "4", className: "study-btn--easy" },
];

/**
 * A review run over the given cards. "Again" sends the card to the back of
 * the queue; the other ratings retire it from the session. Space flips,
 * 1–4 rate, Esc exits.
 */
function StudyMode({ initialCards, onExit }: { initialCards: Flashcard[]; onExit: () => void }) {
  const dispatch = useDispatch();
  const { flashcards, courses } = useActiveSemester();
  const [queue, setQueue] = useState<string[]>(() => initialCards.map((c) => c.id));
  const [revealed, setRevealed] = useState(false);
  const [reviewCount, setReviewCount] = useState(0);
  const [againCount, setAgainCount] = useState(0);

  const cardById = useMemo(() => new Map(flashcards.map((c) => [c.id, c])), [flashcards]);
  // Cards can be deleted mid-session from elsewhere; skip stale ids.
  const liveQueue = queue.filter((id) => cardById.has(id));
  const card = liveQueue.length > 0 ? cardById.get(liveQueue[0])! : null;
  const course = card?.courseId ? courses.find((c) => c.id === card.courseId) : null;

  function rate(rating: ReviewRating) {
    if (!card) return;
    dispatch({ type: "reviewFlashcard", id: card.id, rating });
    setReviewCount((n) => n + 1);
    if (rating === "again") {
      setAgainCount((n) => n + 1);
      setQueue([...liveQueue.slice(1), card.id]);
    } else {
      setQueue(liveQueue.slice(1));
    }
    setRevealed(false);
  }

  // latest-value refs so the single keydown listener sees fresh state
  const rateRef = React.useRef(rate);
  rateRef.current = rate;
  const revealedRef = React.useRef(revealed);
  revealedRef.current = revealed;
  const hasCardRef = React.useRef(!!card);
  hasCardRef.current = !!card;
  const onExitRef = React.useRef(onExit);
  onExitRef.current = onExit;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.key === "Escape") return onExitRef.current();
      if (!hasCardRef.current) return;
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (revealedRef.current) rateRef.current("good");
        else setRevealed(true);
        return;
      }
      if (revealedRef.current) {
        const match = RATINGS.find((r) => r.key === event.key);
        if (match) rateRef.current(match.rating);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!card) {
    return (
      <div className="study-wrap">
        <div className="study-done card">
          <div className="study-done-icon">🎉</div>
          <h2>Session complete</h2>
          <p className="muted">
            {reviewCount} review{reviewCount === 1 ? "" : "s"}
            {againCount > 0 ? ` · ${againCount} lapse${againCount === 1 ? "" : "s"}` : " · perfect run!"}
          </p>
          <button className="btn primary" onClick={onExit}>Back to decks</button>
        </div>
      </div>
    );
  }

  return (
    <div className="study-wrap">
      <div className="study-top">
        <button className="btn ghost small" onClick={onExit}>← End session</button>
        <span className="spacer" />
        <span className="muted">{liveQueue.length} card{liveQueue.length === 1 ? "" : "s"} left</span>
      </div>

      <div
        className={`study-card card ${revealed ? "study-card--revealed" : ""}`}
        onClick={() => !revealed && setRevealed(true)}
      >
        {course && (
          <span className="course-tag" style={{ background: course.color }}>
            {course.code || course.name}
          </span>
        )}
        <div className="study-front">{card.front}</div>
        {revealed ? (
          <>
            <hr className="block-divider" />
            <div className="study-back">{card.back || <span className="muted">(no answer side)</span>}</div>
          </>
        ) : (
          <div className="study-flip-hint">Click or press space to reveal</div>
        )}
      </div>

      {revealed && (
        <div className="study-ratings">
          {RATINGS.map(({ rating, label, key, className }) => (
            <button key={rating} className={`study-btn ${className}`} onClick={() => rate(rating)}>
              <span className="study-btn-label">{label}</span>
              <span className="study-btn-interval">{previewInterval(card, rating)}</span>
              <kbd>{key}</kbd>
            </button>
          ))}
        </div>
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
