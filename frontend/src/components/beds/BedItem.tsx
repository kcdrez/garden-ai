import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
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
import BedDialog from '@/components/beds/BedDialog';

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteBed(gardenId, bed.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beds', gardenId] }),
  });

  const hasDetails = bed.facing || bed.avgSunlightHours != null || bed.soilType || bed.notes;

  function handleCardClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('[data-radix-popper-content-wrapper], [role="menu"], button')) return;
    navigate(`/gardens/${gardenId}/beds/${bed.id}`);
  }

  return (
    <>
      <Card className="cursor-pointer hover:bg-muted/40 transition-colors" onClick={handleCardClick}>
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
            {bed.avgSunlightHours != null && (
              <span className="flex items-center gap-2">
                <SunIcon className="size-3.5 shrink-0" />
                {bed.avgSunlightHours} hrs/day avg. sunlight
              </span>
            )}
            {bed.soilType && (
              <span className="flex items-center gap-2">
                <ShovelIcon className="size-3.5 shrink-0" />
                {bed.soilType}
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

      <BedDialog gardenId={gardenId} bed={bed} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
