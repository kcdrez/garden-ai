import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import { useGardenDetail } from '@/hooks/useGardenDetail';
import { useSortedList } from '@/hooks/useSortedList';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import BedItem from '@/components/beds/BedItem';
import BedDialog from '@/components/beds/BedDialog';
import GardenDetailHeader from '@/components/gardens/GardenDetailHeader';
import GardenGrid from '@/components/gardens/GardenGrid';
import SortDropdown from '@/components/shared/SortDropdown';
import SortableGrid from '@/components/shared/SortableGrid';
import { QueryState, LoadingSpinner } from '@/components/ui/query-state';

export default function GardenDetail() {
  const { id } = useParams<{ id: string }>();
  const [createOpen, setCreateOpen] = useState(false);

  const { garden, beds, gardenLoading, gardenError, bedsLoading, bedsError } = useGardenDetail(id);
  const { sorted: sortedBeds, sortMode, setSortMode, handleReorder } = useSortedList(beds, `garden-${id}-beds`);

  if (gardenLoading) return <div className="p-5"><LoadingSpinner /></div>;
  if (gardenError) return <div className="p-5 text-sm text-destructive">{getErrorMessage(gardenError)}</div>;
  if (!garden) return null;

  return (
    <div className="p-5">
      <div className="mb-6">
        <GardenDetailHeader garden={garden} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2>Garden Beds</h2>
        <div className="flex items-center gap-2">
          <SortDropdown value={sortMode} onChange={setSortMode} />
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4" />
            Add Bed
          </Button>
        </div>
      </div>

      <QueryState isLoading={bedsLoading} error={bedsError} isEmpty={beds.length === 0} emptyMessage="No beds yet. Add one to get started.">
        <SortableGrid
          items={sortedBeds}
          sortMode={sortMode}
          onReorder={handleReorder}
          renderItem={(bed) => <BedItem gardenId={id!} bed={bed} />}
        />
      </QueryState>

      {garden.length && garden.width && (
        <div className="mt-8">
          <h2 className="mb-3">Garden Layout</h2>
          <GardenGrid gardenId={id!} garden={garden} beds={beds} />
        </div>
      )}

      <BedDialog gardenId={id!} open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
