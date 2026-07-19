import React from "react";
import type { Flashcard } from "../../types";
import { uid } from "../../utils/id";
import { newCardScheduling } from "../../utils/srs";
import { courseShortLabel } from "../../utils/courses";
import { useActiveSemester, useDispatch } from "../../store";
import { useFormState } from "../../hooks/useFormState";
import { Field } from "../../components/Field";
import { Modal } from "../../components/Modal";

export function CardModal({
  card,
  defaultCourseId,
  onClose,
  onSaved,
}: {
  card: Flashcard | null;
  defaultCourseId?: string | null;
  onClose: () => void;
  /** Called after a new card is added, so callers can chain "add another". */
  onSaved?: () => void;
}) {
  const dispatch = useDispatch();
  const { semester, courses } = useActiveSemester();
  const { values, setField, setValues } = useFormState({
    front: card?.front ?? "",
    back: card?.back ?? "",
    courseId: card?.courseId ?? defaultCourseId ?? "",
  });

  if (!semester) return null;

  function save(addAnother: boolean) {
    if (!values.front.trim() || !semester) return;
    const saved: Flashcard = {
      ...(card ?? { id: uid(), semesterId: semester.id, ...newCardScheduling() }),
      courseId: values.courseId || null,
      front: values.front.trim(),
      back: values.back.trim(),
    };
    dispatch(card ? { type: "updateFlashcard", card: saved } : { type: "addFlashcard", card: saved });
    onSaved?.();
    if (addAnother && !card) {
      setValues({ front: "", back: "", courseId: values.courseId });
    } else {
      onClose();
    }
  }

  function deleteCard() {
    if (!card) return;
    dispatch({ type: "deleteFlashcard", id: card.id });
    onClose();
  }

  return (
    <Modal title={card ? "Edit card" : "New flashcard"} onClose={onClose}>
      <Field label="Front (question)">
        <textarea
          rows={2}
          value={values.front}
          onChange={(e) => setField("front", e.target.value)}
          placeholder="What does Big-O notation describe?"
          autoFocus
        />
      </Field>
      <Field label="Back (answer)">
        <textarea
          rows={3}
          value={values.back}
          onChange={(e) => setField("back", e.target.value)}
          placeholder="The upper bound of an algorithm's growth rate…"
        />
      </Field>
      <Field label="Deck">
        <select value={values.courseId} onChange={(e) => setField("courseId", e.target.value)}>
          <option value="">— General —</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>{courseShortLabel(course)}</option>
          ))}
        </select>
      </Field>

      <div className="modal-actions">
        {card && (
          <button className="btn danger" onClick={deleteCard}>Delete</button>
        )}
        <span className="spacer" />
        <button className="btn" onClick={onClose}>Cancel</button>
        {!card && (
          <button className="btn" onClick={() => save(true)} disabled={!values.front.trim()}>
            Add & next
          </button>
        )}
        <button className="btn primary" onClick={() => save(false)} disabled={!values.front.trim()}>
          {card ? "Save" : "Add card"}
        </button>
      </div>
    </Modal>
  );
}
