import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Flashcard, ReviewRating } from "../../types";
import { previewInterval } from "../../utils/srs";
import { useActiveSemester, useDispatch } from "../../store";
import { CourseTag } from "../../components/CourseTag";

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
export function StudyMode({ initialCards, onExit }: { initialCards: Flashcard[]; onExit: () => void }) {
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
  const rateRef = useRef(rate);
  rateRef.current = rate;
  const revealedRef = useRef(revealed);
  revealedRef.current = revealed;
  const hasCardRef = useRef(!!card);
  hasCardRef.current = !!card;
  const onExitRef = useRef(onExit);
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
        {course && <CourseTag course={course} />}
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
