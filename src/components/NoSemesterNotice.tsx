import React, { useState } from "react";
import { SemesterModal } from "../features/semesters/SemesterModal";

/** Shown on any page that needs an active semester but none exists yet. */
export function NoSemesterNotice({ message }: { message: string }) {
  const [showManager, setShowManager] = useState(false);

  return (
    <div className="page-wrap">
      <div className="empty empty--action">
        <p>{message}</p>
        <button className="btn primary" onClick={() => setShowManager(true)}>
          + Create a semester
        </button>
      </div>
      {showManager && <SemesterModal onClose={() => setShowManager(false)} />}
    </div>
  );
}
