import React, { useEffect, useState } from "react";
import { StoreProvider } from "./store";
import { Sidebar } from "./components/Sidebar";
import { QuickFind, pushRecentPage } from "./components/QuickFind";
import { Dashboard } from "./views/Dashboard";
import { TasksView } from "./views/Tasks";
import { Timetable } from "./views/Timetable";
import { GradesView } from "./views/Grades";
import { NotesView, PageView } from "./views/Notes";
import { CourseView, type CourseTab } from "./views/Course";

export type View =
  | { kind: "dashboard" }
  | { kind: "tasks" }
  | { kind: "timetable" }
  | { kind: "grades" }
  | { kind: "notes" }
  | { kind: "course"; courseId: string; tab?: CourseTab }
  | { kind: "page"; pageId: string; from?: View };

const THEME_KEY = "mynotion-theme";

export default function App() {
  const [view, setViewRaw] = useState<View>({ kind: "dashboard" });
  const [lastListView, setLastListView] = useState<View>({ kind: "notes" });
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) ?? "light");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Quick Find: ⌘K / Ctrl+K (and ⌘P / Ctrl+P, like Notion)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey && (key === "k" || key === "p")) {
        e.preventDefault();
        setShowSearch((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function setView(v: View) {
    if (v.kind !== "page") setLastListView(v);
    else pushRecentPage(v.pageId);
    setViewRaw(v);
  }

  return (
    <StoreProvider>
      <div className="app">
        <Sidebar
          view={view}
          setView={setView}
          theme={theme}
          toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          openSearch={() => setShowSearch(true)}
        />
        <main className="main">
          {view.kind === "dashboard" && <Dashboard setView={setView} />}
          {view.kind === "tasks" && <TasksView />}
          {view.kind === "timetable" && <Timetable setView={setView} />}
          {view.kind === "grades" && <GradesView setView={setView} />}
          {view.kind === "notes" && <NotesView setView={setView} />}
          {view.kind === "course" && <CourseView courseId={view.courseId} tab={view.tab} setView={setView} key={view.courseId + (view.tab ?? "")} />}
          {view.kind === "page" && <PageView pageId={view.pageId} onBack={() => setViewRaw(lastListView)} />}
        </main>
        {showSearch && (
          <QuickFind
            setView={setView}
            onClose={() => setShowSearch(false)}
            theme={theme}
            toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          />
        )}
      </div>
    </StoreProvider>
  );
}
