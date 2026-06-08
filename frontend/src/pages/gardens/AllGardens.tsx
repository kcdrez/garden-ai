import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { fetchGardens } from '@/api/gardens';
import { queryKeys } from '@/lib/queryKeys';
import { useSortedList } from '@/hooks/useSortedList';
import GardenItem from '@/components/gardens/GardenItem';
import GardenDialog from '@/components/gardens/GardenDialog';
import SortDropdown from '@/components/shared/SortDropdown';
import SortableGrid from '@/components/shared/SortableGrid';
import { Button } from '@/components/ui/button';
import { QueryState } from '@/components/ui/query-state';

export default function Gardens() {
  const [addOpen, setAddOpen] = useState(false);

  const { data: gardens = [], isLoading, error } = useQuery({
    queryKey: queryKeys.gardens.list(),
    queryFn: fetchGardens,
  });

  const { sorted, sortMode, setSortMode, handleReorder } = useSortedList(gardens, 'gardens');

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-6">
        <h1>Your Gardens</h1>
        <div className="flex items-center gap-2">
          <SortDropdown value={sortMode} onChange={setSortMode} />
          <Button onClick={() => setAddOpen(true)}>
            <PlusIcon className="size-4" />
            Add Garden
          </Button>
        </div>
      </div>

      <QueryState isLoading={isLoading} error={error} isEmpty={gardens.length === 0} emptyMessage="No gardens yet.">
        <SortableGrid
          items={sorted}
          sortMode={sortMode}
          onReorder={handleReorder}
          renderItem={(g, isDraggable) => <GardenItem garden={g} isDraggable={isDraggable} />}
        />
      </QueryState>

      <GardenDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
