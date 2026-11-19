import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { Expense } from '../db/types';
import { Toast, type ToastPayload } from '../components/Toast';
import type { ThemeMode } from './useTheme';

interface AddSheetState {
  open: boolean;
  editing: Expense | null;
  presetCategoryId?: string;
  presetDate?: string;
}

interface AppContextValue {
  showToast: (title: string, subtitle?: { text: string; dotColor?: string }) => void;
  sheetState: AddSheetState;
  openAdd: (preset?: { categoryId?: string; date?: string }) => void;
  openEdit: (expense: Expense) => void;
  closeSheet: () => void;
  theme: ThemeMode;
  setTheme: (next: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  children,
  theme,
  setTheme,
  resolvedTheme,
}: {
  children: React.ReactNode;
  theme: ThemeMode;
  setTheme: (next: ThemeMode) => void;
  resolvedTheme: 'light' | 'dark';
}) {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const toastIdRef = useRef(0);

  const [sheetState, setSheetState] = useState<AddSheetState>({
    open: false,
    editing: null,
  });

  const showToast = useCallback(
    (title: string, subtitle?: { text: string; dotColor?: string }) => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastIdRef.current += 1;
      setToast({ id: toastIdRef.current, title, subtitle });
      const duration = subtitle ? 3500 : 2200;
      toastTimerRef.current = window.setTimeout(() => {
        setToast(null);
      }, duration);
    },
    [],
  );

  const openAdd = useCallback((preset?: { categoryId?: string; date?: string }) => {
    setSheetState({
      open: true,
      editing: null,
      presetCategoryId: preset?.categoryId,
      presetDate: preset?.date,
    });
  }, []);

  const openEdit = useCallback((expense: Expense) => {
    setSheetState({
      open: true,
      editing: expense,
    });
  }, []);

  const closeSheet = useCallback(() => {
    setSheetState((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        showToast,
        sheetState,
        openAdd,
        openEdit,
        closeSheet,
        theme,
        setTheme,
        resolvedTheme,
      }}
    >
      {children}
      <Toast toast={toast} />
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
