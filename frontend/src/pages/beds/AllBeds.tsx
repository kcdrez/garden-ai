import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { fetchAllBeds } from '@/api/beds';
import { queryKeys } from '@/lib/queryKeys';
import { groupByGarden } from '@/lib/beds';
import { useGroupedBedSort } from '@/hooks/useGroupedBedSort';
import { Button } from '@/components/ui/button';
import BedDialog from '@/components/beds/BedDialog';
import BedGroupSection from '@/components/beds/BedGroupSection';
import SortDropdown from '@/components/shared/SortDropdown';
import { QueryState } from '@/components/ui/query-state';

export default function AllBeds() {
  const [addOpen, setAddOpen] = useState(false);

  const { data: beds = [], isLoading, error } = useQuery({
    queryKey: queryKeys.beds.byAll(),
    queryFn: fetchAllBeds,
  });

  const grouped = groupByGarden(beds);
  const { sortMode, handleSortChange, handleReorder, getSortedBeds } = useGroupedBedSort();

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-6">
        <h1>Your Beds</h1>
        <div className="flex items-center gap-2">
          <SortDropdown value={sortMode} onChange={(mode) => handleSortChange(mode, grouped)} />
          <Button onClick={() => setAddOpen(true)}>
            <PlusIcon className="size-4" />
            Add Bed
          </Button>
        </div>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={beds.length === 0}
        emptyMessage="No beds yet. Add one from a garden page."
      >
        <div className="flex flex-col gap-8">
          {grouped.map(({ gardenId, gardenName, beds: gardenBeds }) => (
            <BedGroupSection
              key={gardenId}
              gardenId={gardenId}
              gardenName={gardenName}
              beds={getSortedBeds(gardenId, gardenBeds)}
              sortMode={sortMode}
              onReorder={(activeId, overId) => handleReorder(gardenId, activeId, overId)}
            />
          ))}
        </div>
      </QueryState>

      <BedDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
