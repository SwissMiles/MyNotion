import React, { useEffect, useState } from "react";
import { StoreProvider } from "./store";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NavigationProvider, useNavigation } from "./contexts/NavigationContext";
import { QuickFindProvider, useQuickFind } from "./contexts/QuickFindContext";
import { useIsMobile } from "./hooks/useMediaQuery";
import { useWindowEvent } from "./hooks/useWindowEvent";
import { Sidebar } from "./features/layout/Sidebar";
import { MobileTopBar } from "./features/layout/MobileTopBar";
import { MobileTabBar } from "./features/layout/MobileTabBar";
import { QuickFind } from "./features/quick-find/QuickFind";
import { ActiveView } from "./ActiveView";

export default function App() {
  return (
    <StoreProvider>
      <ThemeProvider>
        <NavigationProvider>
          <QuickFindProvider>
            <AppLayout />
          </QuickFindProvider>
        </NavigationProvider>
      </ThemeProvider>
    </StoreProvider>
  );
}

function AppLayout() {
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
      <Sidebar open={drawerOpen} onClose={isMobile ? () => setDrawerOpen(false) : undefined} />
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
