import type { AppState, ID, StudySession } from "../../types";

export type SessionsAction =
  | { type: "addSession"; session: StudySession }
  | { type: "deleteSession"; id: ID };

export function sessionsReducer(state: AppState, action: SessionsAction): AppState {
  switch (action.type) {
    case "addSession":
      return { ...state, sessions: [...state.sessions, action.session] };
    case "deleteSession":
      return { ...state, sessions: state.sessions.filter((s) => s.id !== action.id) };
  }
}
