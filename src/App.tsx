import React, { useEffect, useState } from "react";
import { StoreProvider } from "./store";
import { Sidebar } from "./components/Sidebar";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  function setView(v: View) {
    if (v.kind !== "page") setLastListView(v);
    setViewRaw(v);
    setSidebarOpen(false);
  }

  return (
    <StoreProvider>
      <div className="app">
        <header className="mobile-topbar">
          <button className="icon-btn menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            ☰
          </button>
          <span className="topbar-title">🎓 MyNotion</span>
        </header>
        <Sidebar
          view={view}
          setView={setView}
          theme={theme}
          toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          open={sidebarOpen}
        />
        {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
        <main className="main">
          {view.kind === "dashboard" && <Dashboard setView={setView} />}
          {view.kind === "tasks" && <TasksView />}
          {view.kind === "timetable" && <Timetable setView={setView} />}
          {view.kind === "grades" && <GradesView setView={setView} />}
          {view.kind === "notes" && <NotesView setView={setView} />}
          {view.kind === "course" && <CourseView courseId={view.courseId} tab={view.tab} setView={setView} key={view.courseId + (view.tab ?? "")} />}
          {view.kind === "page" && <PageView pageId={view.pageId} onBack={() => setViewRaw(lastListView)} />}
        </main>
      </div>
    </StoreProvider>
  );
}
