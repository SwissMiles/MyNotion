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

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) ?? "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
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

  function setView(v: View) {
    if (v.kind !== "page") setLastListView(v);
    setViewRaw(v);
  }

  return (
    <StoreProvider key={userId ?? "local"} userId={userId}>
      {userId && cloudConfigured && <CloudSync />}
      {userId && !cloudConfigured && (
        <div className="sync-badge error">⚠️ Supabase not configured — data is only on this device</div>
      )}
      <div className="app">
        <Sidebar
          view={view}
          setView={setView}
          theme={theme}
          toggleTheme={toggleTheme}
          account={account}
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
      </div>
    </StoreProvider>
  );
}
