import { useCallback, useEffect, useState } from 'react';
import { setSetting } from '../db/repo/settings';

export type ThemeMode = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'flowlet-theme';

function readInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'auto';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'auto') return saved;
  return 'auto';
}

function getSystemDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(readInitialTheme);
  const [systemDark, setSystemDark] = useState<boolean>(getSystemDark);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage quota errors
    }
  }, [theme]);

  const setTheme = useCallback(async (next: ThemeMode) => {
    setThemeState(next);
    try {
      await setSetting('theme', next);
    } catch {
      // ignore before db ready
    }
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    theme === 'auto' ? (systemDark ? 'dark' : 'light') : theme;

  return { theme, setTheme, resolvedTheme };
}
