import { renderHook, act } from '@/test/test-utils';
import { useUndoHistory } from './useUndoHistory';

describe('useUndoHistory', () => {
  it('starts with nothing to undo or redo', () => {
    const { result } = renderHook(() => useUndoHistory());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('push makes canUndo true and canRedo false', () => {
    const { result } = renderHook(() => useUndoHistory());
    act(() => result.current.push({ undo: vi.fn(), redo: vi.fn() }));
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('undo calls the undo fn and makes canRedo true', () => {
    const undoFn = vi.fn();
    const { result } = renderHook(() => useUndoHistory());
    act(() => result.current.push({ undo: undoFn, redo: vi.fn() }));
    act(() => result.current.undo());
    expect(undoFn).toHaveBeenCalledTimes(1);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('redo calls the redo fn and restores canUndo', () => {
    const redoFn = vi.fn();
    const { result } = renderHook(() => useUndoHistory());
    act(() => result.current.push({ undo: vi.fn(), redo: redoFn }));
    act(() => result.current.undo());
    act(() => result.current.redo());
    expect(redoFn).toHaveBeenCalledTimes(1);
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('undo is a no-op when history is empty', () => {
    const { result } = renderHook(() => useUndoHistory());
    // should not throw
    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(false);
  });

  it('redo is a no-op when there is nothing to redo', () => {
    const redoFn = vi.fn();
    const { result } = renderHook(() => useUndoHistory());
    act(() => result.current.push({ undo: vi.fn(), redo: redoFn }));
    act(() => result.current.redo()); // nothing to redo yet
    expect(redoFn).not.toHaveBeenCalled();
  });

  it('undoes multiple commands in reverse order', () => {
    const calls: string[] = [];
    const { result } = renderHook(() => useUndoHistory());
    act(() => result.current.push({ undo: () => calls.push('undo-a'), redo: vi.fn() }));
    act(() => result.current.push({ undo: () => calls.push('undo-b'), redo: vi.fn() }));
    act(() => result.current.undo());
    act(() => result.current.undo());
    expect(calls).toEqual(['undo-b', 'undo-a']);
    expect(result.current.canUndo).toBe(false);
  });

  it('redoes multiple commands in forward order', () => {
    const calls: string[] = [];
    const { result } = renderHook(() => useUndoHistory());
    act(() => result.current.push({ undo: vi.fn(), redo: () => calls.push('redo-a') }));
    act(() => result.current.push({ undo: vi.fn(), redo: () => calls.push('redo-b') }));
    act(() => result.current.undo());
    act(() => result.current.undo());
    act(() => result.current.redo());
    act(() => result.current.redo());
    expect(calls).toEqual(['redo-a', 'redo-b']);
    expect(result.current.canRedo).toBe(false);
  });

  it('push after partial undo discards the redo stack', () => {
    const discardedRedo = vi.fn();
    const { result } = renderHook(() => useUndoHistory());
    act(() => result.current.push({ undo: vi.fn(), redo: discardedRedo }));
    act(() => result.current.push({ undo: vi.fn(), redo: vi.fn() }));
    act(() => result.current.undo()); // undo second
    act(() => result.current.undo()); // undo first → cursor at -1
    act(() => result.current.push({ undo: vi.fn(), redo: vi.fn() })); // new branch
    expect(result.current.canRedo).toBe(false);
    act(() => result.current.redo()); // should be no-op
    expect(discardedRedo).not.toHaveBeenCalled();
  });

  it('canUndo and canRedo reflect the cursor position in a multi-step sequence', () => {
    const { result } = renderHook(() => useUndoHistory());
    act(() => result.current.push({ undo: vi.fn(), redo: vi.fn() }));
    act(() => result.current.push({ undo: vi.fn(), redo: vi.fn() }));

    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);

    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.redo());
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);
  });
});
