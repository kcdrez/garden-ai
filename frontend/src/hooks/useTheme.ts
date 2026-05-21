import { useState } from 'react';

export const THEME_STORAGE_KEY = 'theme';

export function useTheme() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark'),
  );

  function toggleTheme() {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    setIsDark(next);
  }

  return { isDark, toggleTheme };
}
