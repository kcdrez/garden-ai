import { renderHook, act } from '@testing-library/react';
import { usePlacementZoom } from './usePlacementZoom';

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('usePlacementZoom', () => {
  describe('initial zoom', () => {
    it('defaults to 1 when no storageKey and no defaultZoom', () => {
      const { result } = renderHook(() => usePlacementZoom());
      expect(result.current.zoom).toBe(1);
    });

    it('uses the provided defaultZoom', () => {
      const { result } = renderHook(() => usePlacementZoom(undefined, 2));
      expect(result.current.zoom).toBe(2);
    });

    it('reads initial zoom from localStorage when storageKey is provided', () => {
      localStorage.setItem('my-canvas', '0.5');
      const { result } = renderHook(() => usePlacementZoom('my-canvas'));
      expect(result.current.zoom).toBe(0.5);
    });

    it('falls back to defaultZoom when stored value is not a valid zoom level', () => {
      localStorage.setItem('my-canvas', '99');
      const { result } = renderHook(() => usePlacementZoom('my-canvas', 2));
      expect(result.current.zoom).toBe(2);
    });

    it('falls back to defaultZoom when stored value is not a number', () => {
      localStorage.setItem('my-canvas', 'fast');
      const { result } = renderHook(() => usePlacementZoom('my-canvas', 3));
      expect(result.current.zoom).toBe(3);
    });
  });

  describe('setZoom', () => {
    it('updates the zoom level', () => {
      const { result } = renderHook(() => usePlacementZoom());
      act(() => result.current.setZoom(2));
      expect(result.current.zoom).toBe(2);
    });

    it('persists to localStorage when storageKey is provided', () => {
      const { result } = renderHook(() => usePlacementZoom('my-canvas'));
      act(() => result.current.setZoom(3));
      expect(localStorage.getItem('my-canvas')).toBe('3');
    });

    it('does not write to localStorage when no storageKey', () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem');
      const { result } = renderHook(() => usePlacementZoom());
      act(() => result.current.setZoom(2));
      expect(setItem).not.toHaveBeenCalled();
      setItem.mockRestore();
    });
  });

  describe('zoomIn', () => {
    it('steps to the next zoom level', () => {
      const { result } = renderHook(() => usePlacementZoom());
      act(() => result.current.zoomIn());
      expect(result.current.zoom).toBe(2);
    });

    it('does nothing at the maximum zoom level', () => {
      const { result } = renderHook(() => usePlacementZoom(undefined, 3));
      act(() => result.current.zoomIn());
      expect(result.current.zoom).toBe(3);
    });

    it('persists the new level to localStorage', () => {
      const { result } = renderHook(() => usePlacementZoom('my-canvas'));
      act(() => result.current.zoomIn());
      expect(localStorage.getItem('my-canvas')).toBe('2');
    });
  });

  describe('zoomOut', () => {
    it('steps to the previous zoom level', () => {
      const { result } = renderHook(() => usePlacementZoom(undefined, 2));
      act(() => result.current.zoomOut());
      expect(result.current.zoom).toBe(1);
    });

    it('does nothing at the minimum zoom level', () => {
      const { result } = renderHook(() => usePlacementZoom(undefined, 0.25));
      act(() => result.current.zoomOut());
      expect(result.current.zoom).toBe(0.25);
    });

    it('persists the new level to localStorage', () => {
      localStorage.setItem('my-canvas', '2');
      const { result } = renderHook(() => usePlacementZoom('my-canvas'));
      act(() => result.current.zoomOut());
      expect(localStorage.getItem('my-canvas')).toBe('1');
    });
  });
});
