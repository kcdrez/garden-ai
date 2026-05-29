import type { ReactNode } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import type { SortMode } from '@/hooks/useSortedList';
import SortableCard from '@/components/shared/SortableCard';

type Props<T extends { id: string }> = {
  items: T[];
  sortMode: SortMode;
  onReorder: (activeId: string, overId: string) => void;
  renderItem: (item: T) => ReactNode;
  className?: string;
};

export default function SortableGrid<T extends { id: string }>({
  items,
  sortMode,
  onReorder,
  renderItem,
  className,
}: Props<T>) {
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
          {items.map((item) => (
            <SortableCard key={item.id} id={item.id} disabled={sortMode !== 'custom'}>
              {renderItem(item)}
            </SortableCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
