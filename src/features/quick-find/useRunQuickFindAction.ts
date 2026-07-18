import { useAppState, useDispatch } from "../../store";
import { useNavigation } from "../../contexts/NavigationContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useQuickFind } from "../../contexts/QuickFindContext";
import { createEmptyPage } from "../notes/pages";
import type { QuickFindAction } from "./types";

/** Interprets a Quick Find result's declarative action. */
export function useRunQuickFindAction() {
  const state = useAppState();
  const dispatch = useDispatch();
  const { navigate } = useNavigation();
  const { toggleTheme } = useTheme();
  const { close } = useQuickFind();

  return (action: QuickFindAction): void => {
    switch (action.type) {
      case "navigate":
        // Switch semester first when the target lives in another one.
        if (action.semesterId && action.semesterId !== state.activeSemesterId) {
          dispatch({ type: "setActiveSemester", id: action.semesterId });
        }
        navigate(action.view);
        close();
        break;
      case "create-page": {
        if (!state.activeSemesterId) return;
        const page = createEmptyPage(state.activeSemesterId, null, action.title);
        dispatch({ type: "addPage", page });
        navigate({ kind: "page", pageId: page.id });
        close();
        break;
      }
      case "toggle-theme":
        toggleTheme();
        close();
        break;
    }
  };
}
