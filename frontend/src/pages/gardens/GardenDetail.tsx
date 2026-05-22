import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, PlusIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { fetchGarden, deleteGarden } from '@/api/gardens';
import { fetchBeds } from '@/api/beds';
import type { Garden, GardenBed } from '@/types/gardens';
import { getErrorMessage } from '@/lib/errors';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import BedItem from '@/components/beds/BedItem';
import BedDialog from '@/components/beds/BedDialog';
import GardenDialog from '@/components/gardens/GardenDialog';
import GardenGrid from '@/components/gardens/GardenGrid';
import { QueryState, LoadingSpinner } from '@/components/ui/query-state';
import { useConfirm } from '@/hooks/useConfirm';

export default function GardenDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteGarden(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gardens'] });
      navigate(routes.gardens());
    },
  });

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete garden?',
      description: `"${garden?.name}" and all its beds and plants will be permanently deleted.`,
    });
    if (ok) deleteMutation.mutate();
  }

  const {
    data: garden,
    isLoading: gardenLoading,
    error: gardenError,
  } = useQuery({
    queryKey: ['gardens', id],
    queryFn: () => fetchGarden(id!),
    enabled: !!id,
    initialData: () =>
      queryClient.getQueryData<Garden[]>(['gardens'])?.find((g) => g.id === id),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['gardens'])?.dataUpdatedAt || Date.now(),
  });

  const {
    data: beds = [],
    isLoading: bedsLoading,
    error: bedsError,
  } = useQuery({
    queryKey: ['beds', 'garden', id],
    queryFn: () => fetchBeds(id!),
    enabled: !!id,
    initialData: () => {
      const allBeds = queryClient.getQueryData<GardenBed[]>(['beds', 'all']);
      return allBeds?.filter((b) => b.garden === id);
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['beds', 'all'])?.dataUpdatedAt || Date.now(),
  });

  if (gardenLoading) return <div className="p-5"><LoadingSpinner /></div>;
  if (gardenError) return <div className="p-5 text-sm text-destructive">{getErrorMessage(gardenError)}</div>;
  if (!garden) return null;

  return (
    <div className="p-5">
      <div className="mb-6">
        <Link
          to={routes.gardens()}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeftIcon className="size-4" />
          Your Gardens
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1>{garden.name}</h1>
            {garden.description && (
              <p className="text-muted-foreground mt-1">{garden.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <PencilIcon className="size-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
            >
              <Trash2Icon className="size-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2>Garden Beds</h2>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" />
          Add Bed
        </Button>
      </div>

      <QueryState isLoading={bedsLoading} error={bedsError} isEmpty={beds.length === 0} emptyMessage="No beds yet. Add one to get started.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {beds.map((bed) => (
            <BedItem key={bed.id} gardenId={id!} bed={bed} />
          ))}
        </div>
      </QueryState>

      {garden.length && garden.width && (
        <div className="mt-8">
          <h2 className="mb-3">Garden Layout</h2>
          <GardenGrid gardenId={id!} garden={garden} beds={beds} />
        </div>
      )}

      <BedDialog
        gardenId={id!}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <GardenDialog
        garden={garden}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  );
}
