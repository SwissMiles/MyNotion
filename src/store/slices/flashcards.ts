import type { AppState, Flashcard, ID, ReviewRating } from "../../types";
import { applyReview } from "../../utils/srs";

export type FlashcardsAction =
  | { type: "addFlashcard"; card: Flashcard }
  | { type: "updateFlashcard"; card: Flashcard }
  | { type: "deleteFlashcard"; id: ID }
  | { type: "reviewFlashcard"; id: ID; rating: ReviewRating };

export function flashcardsReducer(state: AppState, action: FlashcardsAction): AppState {
  switch (action.type) {
    case "addFlashcard":
      return { ...state, flashcards: [...state.flashcards, action.card] };
    case "updateFlashcard":
      return {
        ...state,
        flashcards: state.flashcards.map((c) => (c.id === action.card.id ? action.card : c)),
      };
    case "deleteFlashcard":
      return { ...state, flashcards: state.flashcards.filter((c) => c.id !== action.id) };
    case "reviewFlashcard":
      return {
        ...state,
        flashcards: state.flashcards.map((c) =>
          c.id === action.id ? applyReview(c, action.rating) : c,
        ),
      };
  }
}
