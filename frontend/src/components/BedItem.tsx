import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MoreHorizontalIcon,
  Trash2Icon,
  PencilIcon,
  SunIcon,
  CompassIcon,
  ShovelIcon,
  NotebookPenIcon,
  PlusIcon,
  LeafIcon,
} from 'lucide-react';
import type { GardenBed } from '@/types/gardens';
import { BED_FACINGS } from '@/types/gardens';
import type { UserPlant } from '@/types/plants';
import { deleteBed } from '@/api/beds';
import { fetchUserPlants, deleteUserPlant } from '@/api/plants';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import BedDialog from '@/components/BedDialog';
import UserPlantDialog from '@/components/UserPlantDialog';

type Props = {
  gardenId: string;
  bed: GardenBed;
};

function formatDimensions(bed: GardenBed): string {
  const parts = [bed.length, bed.width];
  if (bed.depth) parts.push(bed.depth);
  return `${parts.join(' × ')} ${bed.unit}`;
}

function facingLabel(value: string): string {
  return BED_FACINGS.find((f) => f.value === value)?.label ?? value;
}

export default function BedItem({ gardenId, bed }: Props) {
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [addPlantOpen, setAddPlantOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<UserPlant | undefined>();

  const { data: userPlants = [] } = useQuery({
    queryKey: ['user-plants', bed.id],
    queryFn: () => fetchUserPlants(gardenId, bed.id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBed(gardenId, bed.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beds', gardenId] }),
  });

  const deleteUserPlantMutation = useMutation({
    mutationFn: (plantId: string) => deleteUserPlant(gardenId, bed.id, plantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-plants', bed.id] }),
  });

  const hasDetails = bed.facing || bed.avg_sunlight_hours != null || bed.soil_type || bed.notes;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{bed.name}</CardTitle>
          <CardDescription>{formatDimensions(bed)}</CardDescription>
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                aria-label="Bed actions"
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <PencilIcon />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  <Trash2Icon />
                  {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </CardHeader>

        {hasDetails && (
          <CardContent className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {bed.facing && (
              <span className="flex items-center gap-2">
                <CompassIcon className="size-3.5 shrink-0" />
                Faces {facingLabel(bed.facing)}
              </span>
            )}
            {bed.avg_sunlight_hours != null && (
              <span className="flex items-center gap-2">
                <SunIcon className="size-3.5 shrink-0" />
                {bed.avg_sunlight_hours} hrs/day avg. sunlight
              </span>
            )}
            {bed.soil_type && (
              <span className="flex items-center gap-2">
                <ShovelIcon className="size-3.5 shrink-0" />
                {bed.soil_type}
              </span>
            )}
            {bed.notes && (
              <span className="flex items-start gap-2">
                <NotebookPenIcon className="size-3.5 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{bed.notes}</span>
              </span>
            )}
          </CardContent>
        )}

        <CardContent className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Plants</span>
            <Button variant="ghost" size="sm" onClick={() => setAddPlantOpen(true)}>
              <PlusIcon className="size-3.5" />
              Add Plant
            </Button>
          </div>

          {userPlants.length === 0 ? (
            <p className="text-sm text-muted-foreground">No plants yet.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {userPlants.map((up) => (
                <li key={up.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <LeafIcon className="size-3.5 shrink-0 text-muted-foreground" />
                    <span>
                      {up.plant_name}
                      {up.variety && <span className="text-muted-foreground"> — {up.variety}</span>}
                    </span>
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                      aria-label="Plant actions"
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingPlant(up); setAddPlantOpen(true); }}>
                        <PencilIcon />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={deleteUserPlantMutation.isPending}
                        onClick={() => deleteUserPlantMutation.mutate(up.id)}
                      >
                        <Trash2Icon />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <BedDialog gardenId={gardenId} bed={bed} open={editOpen} onOpenChange={setEditOpen} />

      <UserPlantDialog
        gardenId={gardenId}
        bedId={bed.id}
        userPlant={editingPlant}
        open={addPlantOpen}
        onOpenChange={(open) => {
          setAddPlantOpen(open);
          if (!open) setEditingPlant(undefined);
        }}
      />
    </>
  );
}
