import { useState, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import { readStorage, writeStorage, sortItems, applyCustomOrder } from './useSortedList';
import type { SortMode } from './useSortedList';
import type { GardenBed } from '@/types/gardens';

type BedGroup = { gardenId: string; beds: GardenBed[] };

const SORT_KEY = 'beds-all-sort';

function gardenOrderKey(gardenId: string): string {
  return `garden-${gardenId}-beds-order`;
}

export function useGroupedBedSort(): {
  sortMode: SortMode;
  handleSortChange: (mode: SortMode, grouped: BedGroup[]) => void;
  handleReorder: (gardenId: string, activeId: string, overId: string) => void;
  getSortedBeds: (gardenId: string, beds: GardenBed[]) => GardenBed[];
} {
  const [sortMode, setSortMode] = useState<SortMode>(() =>
    readStorage<SortMode>(SORT_KEY, 'name-asc'),
  );

  // Per-garden custom orders in React state; lazily populated from localStorage as needed.
  const [customOrders, setCustomOrders] = useState<Record<string, string[]>>({});

  const handleSortChange = useCallback((mode: SortMode, grouped: BedGroup[]) => {
    setSortMode(mode);
    writeStorage(SORT_KEY, mode);
    if (mode === 'custom') {
      setCustomOrders((prev) => {
        const next = { ...prev };
        grouped.forEach(({ gardenId, beds }) => {
          if (next[gardenId]?.length) return;
          const existing = readStorage<string[]>(gardenOrderKey(gardenId), []);
          if (existing.length) {
            next[gardenId] = existing;
          } else {
            const seeded = sortItems(beds, 'name-asc').map((b) => b.id);
            next[gardenId] = seeded;
            writeStorage(gardenOrderKey(gardenId), seeded);
          }
        });
        return next;
      });
    }
  }, []);

  const handleReorder = useCallback((gardenId: string, activeId: string, overId: string) => {
    setCustomOrders((prev) => {
      const order = prev[gardenId] ?? readStorage<string[]>(gardenOrderKey(gardenId), []);
      const oldIndex = order.indexOf(activeId);
      const newIndex = order.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = arrayMove(order, oldIndex, newIndex);
      writeStorage(gardenOrderKey(gardenId), next);
      return { ...prev, [gardenId]: next };
    });
  }, []);

  const getSortedBeds = useCallback(
    (gardenId: string, beds: GardenBed[]): GardenBed[] => {
      if (sortMode !== 'custom') return sortItems(beds, sortMode);
      const order = customOrders[gardenId] ?? readStorage<string[]>(gardenOrderKey(gardenId), []);
      return applyCustomOrder(beds, order);
    },
    [sortMode, customOrders],
  );

  return { sortMode, handleSortChange, handleReorder, getSortedBeds };
}
