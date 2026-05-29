import { Link } from 'react-router-dom';
import { SproutIcon } from 'lucide-react';
import type { UserPlant } from '@/types/plants';
import { routes } from '@/lib/routes';
import CardActionsMenu from '@/components/ui/card-actions-menu';
import StatusBadge from '@/components/plants/StatusBadge';
import UserPlantDialog from '@/components/plants/UserPlantDialog';
import MovePlantDialog from '@/components/plants/MovePlantDialog';
import { usePlantActions } from '@/hooks/usePlantActions';

type Props = {
  plant: UserPlant;
};

export default function PlantItem({ plant }: Props) {
  const { editOpen, setEditOpen, moveOpen, setMoveOpen, cloneMutation, deleteMutation, handleDelete } = usePlantActions(plant);

  return (
    <>
      <li className="flex items-center justify-between py-3 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <SproutIcon className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link to={routes.plantDetail(plant.id)} className="font-medium hover:underline">
                {plant.plantName}
              </Link>
              {plant.variety && (
                <span className="text-muted-foreground text-sm">— {plant.variety}</span>
              )}
              <StatusBadge status={plant.status} />
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
          onClone={() => cloneMutation.mutate()}
          onMove={() => setMoveOpen(true)}
          onDelete={handleDelete}
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
