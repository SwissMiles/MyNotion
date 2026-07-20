import React, { useState } from "react";
import { useAppState, useActiveSemester, useDispatch } from "../../store";
import { SemesterModal } from "./SemesterModal";

export function SemesterPicker() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { semester } = useActiveSemester();
  const [showManager, setShowManager] = useState(false);

  return (
    <div className="sem-picker">
      <select
        value={semester?.id ?? ""}
        onChange={(e) => dispatch({ type: "setActiveSemester", id: e.target.value })}
      >
        {state.semesters.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button className="btn small" onClick={() => setShowManager(true)} title="Manage semesters">
        ⚙️
      </button>
      {showManager && <SemesterModal onClose={() => setShowManager(false)} />}
    </div>
  );
}
