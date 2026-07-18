import React, { useEffect, useState } from "react";
import { StoreProvider } from "./store";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./views/Dashboard";
import { TasksView } from "./views/Tasks";
import { Timetable } from "./views/Timetable";
import { GradesView } from "./views/Grades";
import { NotesView, PageView } from "./views/Notes";
import { CourseView, type CourseTab } from "./views/Course";
import { QuickSearch } from "./components/QuickSearch";

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
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function setView(v: View) {
    if (v.kind !== "page") setLastListView(v);
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
          openSearch={() => setSearchOpen(true)}
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
        {searchOpen && <QuickSearch setView={setView} onClose={() => setSearchOpen(false)} />}
      </div>
    </StoreProvider>
  );
}
