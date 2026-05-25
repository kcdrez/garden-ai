import { renderHook, act } from '@/test/test-utils';
import { useTheme, THEME_STORAGE_KEY } from './useTheme';

beforeEach(() => {
  document.documentElement.classList.remove('dark');
  localStorage.clear();
});

describe('useTheme', () => {
  it('returns isDark false when dark class is absent', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(false);
  });

  it('returns isDark true when dark class is present on mount', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.isDark).toBe(true);
  });

  it('toggleTheme adds the dark class and persists to localStorage', () => {
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('toggleTheme removes the dark class and persists to localStorage', () => {
    document.documentElement.classList.add('dark');
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggleTheme());

    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(result.current.isDark).toBe(false);
  });
});
