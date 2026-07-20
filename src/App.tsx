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
import { ThemeProvider } from "./contexts/ThemeContext";
import { FocusProvider } from "./contexts/FocusContext";
import { NavigationProvider, useNavigation } from "./contexts/NavigationContext";
import { QuickFindProvider, useQuickFind } from "./contexts/QuickFindContext";
import { useIsMobile } from "./hooks/useMediaQuery";
import { useWindowEvent } from "./hooks/useWindowEvent";
import { Sidebar } from "./features/layout/Sidebar";
import { MobileTopBar } from "./features/layout/MobileTopBar";
import { MobileTabBar } from "./features/layout/MobileTabBar";
import { QuickFind } from "./features/quick-find/QuickFind";
import { SignInScreen } from "./features/auth/SignInScreen";
import { CloudSync } from "./features/cloud/CloudSync";
import { clerkConfigured, cloudConfigured } from "./config";
import { ActiveView } from "./ActiveView";

export default function App() {
  // without a Clerk key the app runs exactly as before: local-only, no login
  if (!clerkConfigured) {
    return <Workspace userId={null} account={null} />;
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
        <SignedInWorkspace />
      </SignedIn>
    </>
  );
}

function SignedInWorkspace() {
  const { user } = useUser();
  if (!user) return null;
  return (
    <Workspace
      userId={user.id}
      account={<UserButton afterSignOutUrl={import.meta.env.BASE_URL} />}
    />
  );
}

function Workspace({ userId, account }: { userId: string | null; account: React.ReactNode }) {
  return (
    <StoreProvider key={userId ?? "local"} userId={userId}>
      <ThemeProvider>
        <FocusProvider>
          <NavigationProvider>
            <QuickFindProvider>
              {userId && cloudConfigured && <CloudSync />}
              {userId && !cloudConfigured && (
                <div className="sync-badge error">
                  ⚠️ Supabase not configured — data is only on this device
                </div>
              )}
              <AppLayout account={account} />
            </QuickFindProvider>
          </NavigationProvider>
        </FocusProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}

function AppLayout({ account }: { account: React.ReactNode }) {
  const { isOpen } = useQuickFind();
  const { view } = useNavigation();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Navigating (from the drawer or anywhere else) should reveal the content.
  useEffect(() => setDrawerOpen(false), [view]);
  useEffect(() => {
    if (!isMobile) setDrawerOpen(false);
  }, [isMobile]);

  useWindowEvent("keydown", (e) => {
    if (e.key === "Escape" && drawerOpen) setDrawerOpen(false);
  });

  return (
    <div className={`app ${isMobile ? "app--mobile" : ""}`}>
      {isMobile && <MobileTopBar onMenu={() => setDrawerOpen(true)} />}
      <Sidebar
        open={drawerOpen}
        onClose={isMobile ? () => setDrawerOpen(false) : undefined}
        account={account}
      />
      {isMobile && drawerOpen && (
        <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
      )}
      <main className="main">
        <ActiveView />
      </main>
      {isMobile && <MobileTabBar />}
      {isOpen && <QuickFind />}
    </div>
  );
}
