import { useState, useMemo, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';

export type SortMode = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'custom';

type SortableItem = { id: string; name: string; createdAt: string };

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function applyCustomOrder<T extends { id: string }>(items: T[], order: string[]): T[] {
  if (order.length === 0) return items;
  const orderMap = new Map(order.map((id, i) => [id, i]));
  const known: T[] = [];
  const unknown: T[] = [];
  for (const item of items) {
    if (orderMap.has(item.id)) known.push(item);
    else unknown.push(item);
  }
  known.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
  return [...known, ...unknown];
}

export function sortItems<T extends SortableItem>(items: T[], mode: Exclude<SortMode, 'custom'>): T[] {
  return [...items].sort((a, b) => {
    switch (mode) {
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'date-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'date-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
}

export function useSortedList<T extends SortableItem>(
  items: T[],
  storageKey: string,
): {
  sorted: T[];
  sortMode: SortMode;
  setSortMode: (mode: SortMode) => void;
  handleReorder: (activeId: string, overId: string) => void;
} {
  const [sortMode, setSortModeState] = useState<SortMode>(() =>
    readStorage<SortMode>(`${storageKey}-sort`, 'name-asc'),
  );

  const [customOrder, setCustomOrder] = useState<string[]>(() =>
    readStorage<string[]>(`${storageKey}-order`, []),
  );

  const setSortMode = useCallback(
    (mode: SortMode) => {
      if (mode === 'custom' && customOrder.length === 0) {
        // Seed custom order from the current non-custom sort so the list doesn't jump
        const currentSorted = sortItems(items, sortMode === 'custom' ? 'name-asc' : sortMode);
        const seeded = currentSorted.map((i) => i.id);
        setCustomOrder(seeded);
        writeStorage(`${storageKey}-order`, seeded);
      }
      setSortModeState(mode);
      writeStorage(`${storageKey}-sort`, mode);
    },
    [customOrder.length, items, sortMode, storageKey],
  );

  const handleReorder = useCallback(
    (activeId: string, overId: string) => {
      setCustomOrder((prev) => {
        const oldIndex = prev.indexOf(activeId);
        const newIndex = prev.indexOf(overId);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const next = arrayMove(prev, oldIndex, newIndex);
        writeStorage(`${storageKey}-order`, next);
        return next;
      });
    },
    [storageKey],
  );

  const sorted = useMemo(() => {
    if (sortMode !== 'custom') return sortItems(items, sortMode);
    return applyCustomOrder(items, customOrder);
  }, [items, sortMode, customOrder]);

  return { sorted, sortMode, setSortMode, handleReorder };
}
