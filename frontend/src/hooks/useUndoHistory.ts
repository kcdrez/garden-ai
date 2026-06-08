import { useCallback, useReducer, useRef } from 'react';

type Command = { undo: () => void; redo: () => void };

export function useUndoHistory() {
  const stackRef = useRef<Command[]>([]);
  const cursorRef = useRef(-1);
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const push = useCallback((command: Command) => {
    stackRef.current = stackRef.current.slice(0, cursorRef.current + 1);
    stackRef.current.push(command);
    cursorRef.current = stackRef.current.length - 1;
    forceUpdate();
  }, []);

  const undo = useCallback(() => {
    if (cursorRef.current < 0) return;
    stackRef.current[cursorRef.current].undo();
    cursorRef.current--;
    forceUpdate();
  }, []);

  const redo = useCallback(() => {
    if (cursorRef.current >= stackRef.current.length - 1) return;
    cursorRef.current++;
    stackRef.current[cursorRef.current].redo();
    forceUpdate();
  }, []);

  return {
    push,
    undo,
    redo,
    canUndo: cursorRef.current >= 0,
    canRedo: cursorRef.current < stackRef.current.length - 1,
  };
}
