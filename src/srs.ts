import type { Flashcard, ReviewRating } from "./types";
import { isoDateLocal } from "./lib";

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;

/** Spaced-repetition defaults for a brand-new card. */
export function newCardScheduling(): Pick<Flashcard, "ease" | "intervalDays" | "reps" | "due"> {
  return { ease: 2.5, intervalDays: 0, reps: 0, due: isoDateLocal() };
}

/**
 * SM-2-style scheduler. "Again" resets the card and keeps it due today so it
 * cycles back into the current study session; the other ratings push the card
 * out by a growing interval scaled by the card's ease factor.
 */
export function applyReview(card: Flashcard, rating: ReviewRating, today: Date = new Date()): Flashcard {
  let { ease, intervalDays, reps } = card;

  switch (rating) {
    case "again":
      ease = Math.max(MIN_EASE, ease - 0.2);
      intervalDays = 0;
      reps = 0;
      break;
    case "hard":
      ease = Math.max(MIN_EASE, ease - 0.15);
      intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
      reps += 1;
      break;
    case "good":
      if (intervalDays === 0) intervalDays = 1;
      else if (intervalDays === 1) intervalDays = 3;
      else intervalDays = Math.round(intervalDays * ease);
      reps += 1;
      break;
    case "easy":
      ease = Math.min(MAX_EASE, ease + 0.15);
      intervalDays = Math.max(2, Math.round(Math.max(1, intervalDays) * ease * 1.3));
      reps += 1;
      break;
  }

  const due = new Date(today.getFullYear(), today.getMonth(), today.getDate() + intervalDays);
  return { ...card, ease, intervalDays, reps, due: isoDateLocal(due) };
}

/** A card is due when its due date is today or earlier. */
export function isDue(card: Flashcard, todayIso: string = isoDateLocal()): boolean {
  return card.due <= todayIso;
}

export function dueCards(cards: Flashcard[], todayIso: string = isoDateLocal()): Flashcard[] {
  return cards.filter((c) => isDue(c, todayIso));
}

/** Rough human label for when the card comes back if rated this way. */
export function previewInterval(card: Flashcard, rating: ReviewRating): string {
  const days = applyReview(card, rating).intervalDays;
  if (days === 0) return "now";
  if (days === 1) return "1d";
  if (days < 30) return `${days}d`;
  return `${Math.round(days / 30)}mo`;
}
