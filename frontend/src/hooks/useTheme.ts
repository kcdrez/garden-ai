import { useState } from 'react';

export function useTheme() {
  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark'),
  );

  function toggleTheme() {
    const next = !isDark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setIsDark(next);
  }

  return { isDark, toggleTheme };
}
