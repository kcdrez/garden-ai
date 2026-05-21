import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SproutIcon } from 'lucide-react';
import type { UserPlant } from '@/types/plants';
import { USER_PLANT_STATUSES } from '@/types/plants';
import { deleteUserPlant } from '@/api/plants';
import { routes } from '@/lib/routes';
import CardActionsMenu from '@/components/ui/card-actions-menu';
import UserPlantDialog from '@/components/plants/UserPlantDialog';
import MovePlantDialog from '@/components/plants/MovePlantDialog';

const STATUS_CLASSES: Record<string, string> = {
  planned: 'bg-muted text-muted-foreground',
  planted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  growing: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  fruiting: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  dormant: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  removed: 'bg-muted text-muted-foreground line-through',
};

function statusLabel(value: string): string {
  return USER_PLANT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

type Props = {
  plant: UserPlant;
};

export default function PlantItem({ plant }: Props) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteUserPlant(plant.gardenId, plant.bed, plant.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plants', 'user'] }),
  });

  return (
    <>
      <li className="flex items-center justify-between py-3 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <SproutIcon className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{plant.plantName}</span>
              {plant.variety && (
                <span className="text-muted-foreground text-sm">— {plant.variety}</span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[plant.status] ?? 'bg-muted text-muted-foreground'}`}
              >
                {statusLabel(plant.status)}
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              <Link to={routes.bedDetail(plant.gardenId, plant.bed)} className="hover:text-foreground">
                {plant.bedName}
              </Link>
              <span className="mx-1">·</span>
              <Link to={routes.gardenDetail(plant.gardenId)} className="hover:text-foreground">
                {plant.gardenName}
              </Link>
            </div>
          </div>
        </div>
        <CardActionsMenu
          label="Plant actions"
          onEdit={() => setEditOpen(true)}
          onMove={() => setMoveOpen(true)}
          onDelete={() => deleteMutation.mutate()}
          isDeleting={deleteMutation.isPending}
        />
      </li>

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
    </>
  );
}
