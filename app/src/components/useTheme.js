import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';
const THEME_EVENT = 'theme-change';

function readTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.getAttribute('data-theme') || 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage may be blocked (private mode, etc.) — non-fatal.
  }
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: theme }));
}

export function useTheme() {
  const [theme, setThemeState] = useState(readTheme);

  useEffect(() => {
    const onChange = (e) => setThemeState(e.detail);
    window.addEventListener(THEME_EVENT, onChange);
    return () => window.removeEventListener(THEME_EVENT, onChange);
  }, []);

  return [theme, applyTheme];
}
