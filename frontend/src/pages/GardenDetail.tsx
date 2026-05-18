import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftIcon, PlusIcon } from 'lucide-react';
import { fetchGarden } from '@/api/gardens';
import { fetchBeds } from '@/api/beds';
import { getErrorMessage } from '@/lib/errors';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import BedItem from '@/components/beds/BedItem';
import BedDialog from '@/components/beds/BedDialog';
import { QueryState, LoadingSpinner } from '@/components/ui/query-state';

export default function GardenDetail() {
  const { id } = useParams<{ id: string }>();
  const [createOpen, setCreateOpen] = useState(false);

  const {
    data: garden,
    isLoading: gardenLoading,
    error: gardenError,
  } = useQuery({
    queryKey: ['garden', id],
    queryFn: () => fetchGarden(id!),
    enabled: !!id,
  });

  const {
    data: beds = [],
    isLoading: bedsLoading,
    error: bedsError,
  } = useQuery({
    queryKey: ['beds', id],
    queryFn: () => fetchBeds(id!),
    enabled: !!id,
  });

  if (gardenLoading)
    return (
      <div className="p-5">
        <LoadingSpinner />
      </div>
    );
  if (gardenError)
    return (
      <div className="p-5 text-sm text-destructive">
        {getErrorMessage(gardenError)}
      </div>
    );
  if (!garden) return null;

  return (
    <div className="p-5">
      <div className="mb-6">
        <Link
          to={routes.gardens()}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeftIcon className="size-4" />
          All Gardens
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h2>{garden.name}</h2>
            {garden.description && (
              <p className="text-muted-foreground mt-1">{garden.description}</p>
            )}
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon className="size-4" />
            Add Bed
          </Button>
        </div>
      </div>

      <h3 className="mb-3">Garden Beds</h3>

      <QueryState
        isLoading={bedsLoading}
        error={bedsError}
        isEmpty={beds.length === 0}
        emptyMessage="No beds yet. Add one to get started."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {beds.map((bed) => (
            <BedItem key={bed.id} gardenId={id!} bed={bed} />
          ))}
        </div>
      </QueryState>

      <BedDialog
        gardenId={id!}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
