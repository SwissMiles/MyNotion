import React, { useState } from "react";
import type { Flashcard } from "../../types";
import { uid } from "../../utils/id";
import { newCardScheduling } from "../../utils/srs";
import { courseShortLabel } from "../../utils/courses";
import { useActiveSemester, useDispatch } from "../../store";
import { useUndoableDispatch } from "../../contexts/UndoContext";
import { Field } from "../../components/Field";
import { Modal } from "../../components/Modal";

export function CardModal({
  card,
  defaultCourseId,
  onClose,
}: {
  card: Flashcard | null;
  defaultCourseId?: string | null;
  onClose: () => void;
}) {
  const dispatch = useDispatch();
  const dispatchUndoable = useUndoableDispatch();
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
            <option key={course.id} value={course.id}>{courseShortLabel(course)}</option>
          ))}
        </select>
      </Field>

      <div className="modal-actions">
        {card && (
          <button
            className="btn danger"
            onClick={() => {
              dispatchUndoable("Flashcard deleted", { type: "deleteFlashcard", id: card.id });
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
