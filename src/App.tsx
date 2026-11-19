import { useEffect, useState } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { TabBar } from './components/TabBar';
import { initDB } from './db';
import { AddSheet } from './features/add/AddSheet';
import { AppProvider, useApp } from './hooks/useAppContext';
import { useTheme } from './hooks/useTheme';
import { AppRoutes } from './routes';

const TAB_ROUTES = new Set(['/', '/list', '/stats', '/settings']);

function AppShell() {
  const { pathname } = useLocation();
  const { openAdd } = useApp();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void initDB().then(() => setReady(true));
  }, []);

  const showTabBar = TAB_ROUTES.has(pathname);

  return (
    <div className="app-outer">
      <div className="app-shell">
        {ready ? (
          <>
            <AppRoutes />
            {showTabBar && <TabBar onOpenAdd={() => openAdd()} />}
            <AddSheet />
          </>
        ) : (
          <div className="page-scroll caption" style={{ textAlign: 'center', paddingTop: 120 }}>
            正在载入账本…
          </div>
        )}
      </div>
    </div>
  );
}

export function App() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <BrowserRouter>
      <AppProvider theme={theme} setTheme={setTheme} resolvedTheme={resolvedTheme}>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  );
}
