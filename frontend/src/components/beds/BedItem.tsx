import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { MoreHorizontalIcon, Trash2Icon, PencilIcon } from 'lucide-react';
import type { GardenBed } from '@/types/gardens';
import { formatDimensions } from '@/lib/beds';
import BedMeta from '@/components/beds/BedMeta';
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


export default function BedItem({ gardenId, bed }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteBed(gardenId, bed.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beds'] }),
  });

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

        {(bed.facing || bed.avgSunlightHours != null || bed.soilType || bed.notes) && (
          <CardContent>
            <BedMeta bed={bed} />
          </CardContent>
        )}
      </Card>

      <BedDialog gardenId={gardenId} bed={bed} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
