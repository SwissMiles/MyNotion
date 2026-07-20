import React from "react";
import type { CourseMeeting } from "../../types";
import { DAY_NAMES } from "../../constants";

const NEW_MEETING: CourseMeeting = { day: 0, start: "09:00", end: "10:00", location: "" };

/** Editable list of a course's weekly meeting times. */
export function MeetingsEditor({
  meetings,
  onChange,
}: {
  meetings: CourseMeeting[];
  onChange: (meetings: CourseMeeting[]) => void;
}) {
  function patchMeeting(index: number, patch: Partial<CourseMeeting>) {
    onChange(meetings.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function removeMeeting(index: number) {
    onChange(meetings.filter((_, i) => i !== index));
  }

  return (
    <div>
      {meetings.map((meeting, index) => (
        <div key={index} className="form-cols meeting-row">
          <select value={meeting.day} onChange={(e) => patchMeeting(index, { day: Number(e.target.value) })}>
            {DAY_NAMES.map((day, dayIndex) => (
              <option key={day} value={dayIndex}>{day}</option>
            ))}
          </select>
          <input type="time" value={meeting.start} onChange={(e) => patchMeeting(index, { start: e.target.value })} />
          <input type="time" value={meeting.end} onChange={(e) => patchMeeting(index, { end: e.target.value })} />
          <input
            value={meeting.location}
            placeholder="Room"
            onChange={(e) => patchMeeting(index, { location: e.target.value })}
          />
          <button className="icon-btn" onClick={() => removeMeeting(index)}>✕</button>
        </div>
      ))}
      <button className="btn small" type="button" onClick={() => onChange([...meetings, NEW_MEETING])}>
        + Add meeting time
      </button>
    </div>
  );
}
