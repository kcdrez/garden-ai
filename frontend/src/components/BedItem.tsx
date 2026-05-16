import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MoreHorizontalIcon,
  Trash2Icon,
  PencilIcon,
  SunIcon,
  CompassIcon,
  ShovelIcon,
  NotebookPenIcon,
} from 'lucide-react';
import type { GardenBed } from '@/types/gardens';
import { BED_FACINGS } from '@/types/gardens';
import { deleteBed } from '@/api/beds';
import { buttonVariants } from '@/components/ui/button';
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

  const deleteMutation = useMutation({
    mutationFn: () => deleteBed(gardenId, bed.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beds', gardenId] }),
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
      </Card>

      <BedDialog
        gardenId={gardenId}
        bed={bed}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
