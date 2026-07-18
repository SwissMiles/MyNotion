import React from "react";
import { StoreProvider } from "./store";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NavigationProvider } from "./contexts/NavigationContext";
import { QuickFindProvider, useQuickFind } from "./contexts/QuickFindContext";
import { Sidebar } from "./features/layout/Sidebar";
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

  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <ActiveView />
      </main>
      {isOpen && <QuickFind />}
    </div>
  );
}
