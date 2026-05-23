import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PencilIcon, Trash2Icon, CalendarIcon, StickyNoteIcon } from 'lucide-react';
import { fetchUserPlant, deleteUserPlant } from '@/api/plants';
import PlantTimeline from '@/components/plants/PlantTimeline';
import UserPlantDialog from '@/components/plants/UserPlantDialog';
import MovePlantDialog from '@/components/plants/MovePlantDialog';
import StatusBadge from '@/components/plants/StatusBadge';
import { LoadingSpinner } from '@/components/ui/query-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { routes } from '@/lib/routes';
import { getErrorMessage } from '@/lib/errors';
import type { UserPlant } from '@/types/plants';
import { PLANT_CATEGORIES } from '@/types/plants';
import { useConfirm } from '@/hooks/useConfirm';

export default function PlantDetail() {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const { data: plant, isLoading, error } = useQuery({
    queryKey: ['plants', 'user', 'detail', plantId],
    queryFn: () => fetchUserPlant(plantId!),
    enabled: !!plantId,
    initialData: () => {
      const all = queryClient.getQueryData<UserPlant[]>(['plants', 'user', 'all']);
      return all?.find((p) => p.id === plantId);
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['plants', 'user', 'all'])?.dataUpdatedAt || Date.now(),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUserPlant(plant!.gardenId, plant!.bed, plant!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants', 'user'] });
      navigate(routes.bedDetail(plant!.gardenId, plant!.bed));
    },
  });

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete plant?',
      description: `"${plant!.plantName}${plant!.variety ? ` — ${plant!.variety}` : ''}" will be permanently deleted.`,
    });
    if (ok) deleteMutation.mutate();
  }

  if (isLoading) return <div className="p-5"><LoadingSpinner /></div>;
  if (error) return <div className="p-5 text-sm text-destructive">{getErrorMessage(error)}</div>;
  if (!plant) return null;

  const categoryLabel = PLANT_CATEGORIES.find((c) => c.value === plant.plantCategory)?.label;

  return (
    <div className="p-5">
      <div className="mb-6">
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <Link to={routes.gardenDetail(plant.gardenId)} className="hover:text-foreground">
            {plant.gardenName}
          </Link>
          <span>/</span>
          <Link to={routes.bedDetail(plant.gardenId, plant.bed)} className="hover:text-foreground">
            {plant.bedName}
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1>{plant.plantName}</h1>
              {plant.variety && (
                <span className="text-muted-foreground text-xl">— {plant.variety}</span>
              )}
              <StatusBadge status={plant.status} />
            </div>
            {plant.plantCategory && (
              <p className="text-muted-foreground mt-1 text-sm italic">
                {categoryLabel}
              </p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => setMoveOpen(true)}>
              Move
            </Button>
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
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </div>

      {(plant.startDate || plant.notes) && (
        <Card className="mb-6">
          <CardContent className="space-y-2">
            {plant.startDate && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Started</span>
                <span>{plant.startDate}</span>
              </div>
            )}
            {plant.notes && (
              <div className="flex items-start gap-2 text-sm">
                <StickyNoteIcon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{plant.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3">Timeline</h2>
        <PlantTimeline gardenId={plant.gardenId} bedId={plant.bed} plant={plant} />
      </div>

      <UserPlantDialog
        gardenId={plant.gardenId}
        bedId={plant.bed}
        userPlant={plant}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <MovePlantDialog
        userPlant={plant}
        open={moveOpen}
        onOpenChange={setMoveOpen}
      />
    </div>
  );
}
