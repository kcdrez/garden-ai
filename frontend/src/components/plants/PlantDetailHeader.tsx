import { Link, useNavigate } from 'react-router-dom';
import { CopyIcon, PencilIcon, Trash2Icon, CalendarIcon, StickyNoteIcon } from 'lucide-react';
import { routes } from '@/lib/routes';
import type { UserPlant } from '@/types/plants';
import { PLANT_CATEGORIES } from '@/types/plants';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StatusBadge from '@/components/plants/StatusBadge';
import PlantEditForm from '@/components/plants/PlantEditForm';
import MovePlantDialog from '@/components/plants/MovePlantDialog';
import { usePlantActions } from '@/hooks/usePlantActions';

type Props = {
  plant: UserPlant;
};

export default function PlantDetailHeader({ plant }: Props) {
  const navigate = useNavigate();
  const { editOpen, setEditOpen, moveOpen, setMoveOpen, cloneMutation, deleteMutation, handleDelete } = usePlantActions(plant, {
    onDeleteSuccess: () => navigate(routes.bedDetail(plant.gardenId, plant.bed)),
  });

  const categoryLabel = PLANT_CATEGORIES.find((c) => c.value === plant.plantCategory)?.label;

  return (
    <>
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
        <Link to={routes.gardenDetail(plant.gardenId)} className="hover:text-foreground">
          {plant.gardenName}
        </Link>
        <span>/</span>
        <Link to={routes.bedDetail(plant.gardenId, plant.bed)} className="hover:text-foreground">
          {plant.bedName}
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1>{plant.plantName}</h1>
            {plant.variety && (
              <span className="text-muted-foreground text-xl">— {plant.variety}</span>
            )}
            <StatusBadge status={plant.status} />
          </div>
          {plant.plantCategory && (
            <p className="text-muted-foreground mt-1 text-sm italic">{categoryLabel}</p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setMoveOpen(true)}>
            Move to Another Bed
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={cloneMutation.isPending}
            onClick={() => cloneMutation.mutate()}
          >
            <CopyIcon className="size-4" />
            Clone
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
            Delete
          </Button>
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

      <PlantEditForm userPlant={plant} open={editOpen} onOpenChange={setEditOpen} />
      <MovePlantDialog userPlant={plant} open={moveOpen} onOpenChange={setMoveOpen} />
    </>
  );
}
