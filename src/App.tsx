import React, { useEffect, useState } from "react";
import {
  AuthenticateWithRedirectCallback,
  ClerkLoading,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { StoreProvider } from "./store";
import { Sidebar } from "./components/Sidebar";
import { ToastProvider } from "./components/ui";
import { SearchPalette } from "./components/SearchPalette";
import { Dashboard } from "./views/Dashboard";
import { TasksView } from "./views/Tasks";
import { Timetable } from "./views/Timetable";
import { GradesView } from "./views/Grades";
import { NotesView, PageView } from "./views/Notes";
import { CourseView, type CourseTab } from "./views/Course";
import { SignInScreen } from "./auth";
import { CloudSync } from "./cloud";
import { clerkConfigured, cloudConfigured } from "./config";

export type View =
  | { kind: "dashboard" }
  | { kind: "tasks" }
  | { kind: "timetable" }
  | { kind: "grades" }
  | { kind: "notes" }
  | { kind: "course"; courseId: string; tab?: CourseTab }
  | { kind: "page"; pageId: string; from?: View };

const THEME_KEY = "mynotion-theme";
const THEME_COLORS: Record<string, string> = { light: "#ffffff", dark: "#191919" };

const BOTTOM_NAV: { kind: View["kind"]; icon: string; label: string }[] = [
  { kind: "dashboard", icon: "🏠", label: "Home" },
  { kind: "tasks", icon: "✅", label: "Tasks" },
  { kind: "timetable", icon: "🗓️", label: "Timetable" },
  { kind: "grades", icon: "📊", label: "Grades" },
  { kind: "notes", icon: "📄", label: "Notes" },
];

export default function App() {
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem(THEME_KEY) ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"),
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    document.getElementById("meta-theme-color")?.setAttribute("content", THEME_COLORS[theme] ?? "#ffffff");
  }, [theme]);

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // without a Clerk key the app runs exactly as before: local-only, no login
  if (!clerkConfigured) {
    return <Workspace userId={null} account={null} theme={theme} toggleTheme={toggleTheme} />;
  }

  if (window.location.pathname.endsWith("/sso-callback")) {
    return <AuthenticateWithRedirectCallback />;
  }

  return (
    <>
      <ClerkLoading>
        <div className="auth-screen">
          <div className="muted">Loading…</div>
        </div>
      </ClerkLoading>
      <SignedOut>
        <SignInScreen />
      </SignedOut>
      <SignedIn>
        <SignedInWorkspace theme={theme} toggleTheme={toggleTheme} />
      </SignedIn>
    </>
  );
}

function SignedInWorkspace({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const { user } = useUser();
  if (!user) return null;
  return (
    <Workspace
      userId={user.id}
      account={<UserButton afterSignOutUrl={import.meta.env.BASE_URL} />}
      theme={theme}
      toggleTheme={toggleTheme}
    />
  );
}

function Workspace({
  userId,
  account,
  theme,
  toggleTheme,
}: {
  userId: string | null;
  account: React.ReactNode;
  theme: string;
  toggleTheme: () => void;
}) {
  const [view, setViewRaw] = useState<View>({ kind: "dashboard" });
  const [lastListView, setLastListView] = useState<View>({ kind: "notes" });
  const [navOpen, setNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // hide the bottom nav while the on-screen keyboard is up so it doesn't ride above it
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () =>
      document.documentElement.classList.toggle("kb-open", vv.height < window.innerHeight * 0.75);
    vv.addEventListener("resize", onResize);
    return () => {
      vv.removeEventListener("resize", onResize);
      document.documentElement.classList.remove("kb-open");
    };
  }, []);

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
    setNavOpen(false);
    document.querySelector(".main")?.scrollTo(0, 0);
  }

  return (
    <StoreProvider key={userId ?? "local"} userId={userId}>
      <ToastProvider>
        {userId && cloudConfigured && <CloudSync />}
        {userId && !cloudConfigured && (
          <div className="sync-badge error">⚠️ Supabase not configured — data is only on this device</div>
        )}
        <div className="app">
          <header className="topbar">
            <button className="icon-btn topbar-btn" onClick={() => setNavOpen(true)} aria-label="Open menu">
              ☰
            </button>
            <span className="topbar-title">🎓 MyNotion</span>
            <button className="icon-btn topbar-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
              🔍
            </button>
          </header>

          <Sidebar
            view={view}
            setView={setView}
            theme={theme}
            toggleTheme={toggleTheme}
            open={navOpen}
            onClose={() => setNavOpen(false)}
            openSearch={() => setSearchOpen(true)}
            account={account}
          />
          {navOpen && <div className="drawer-backdrop" onClick={() => setNavOpen(false)} />}

          <main className="main">
            {view.kind === "dashboard" && <Dashboard setView={setView} />}
            {view.kind === "tasks" && <TasksView />}
            {view.kind === "timetable" && <Timetable setView={setView} />}
            {view.kind === "grades" && <GradesView setView={setView} />}
            {view.kind === "notes" && <NotesView setView={setView} />}
            {view.kind === "course" && (
              <CourseView courseId={view.courseId} tab={view.tab} setView={setView} key={view.courseId + (view.tab ?? "")} />
            )}
            {view.kind === "page" && <PageView pageId={view.pageId} onBack={() => setViewRaw(lastListView)} />}
          </main>

          <nav className="bottom-nav">
            {BOTTOM_NAV.map((item) => (
              <button
                key={item.kind}
                className={view.kind === item.kind ? "active" : ""}
                onClick={() => setView({ kind: item.kind } as View)}
              >
                <span className="bn-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {searchOpen && <SearchPalette setView={setView} onClose={() => setSearchOpen(false)} />}
        </div>
      </ToastProvider>
    </StoreProvider>
  );
}
