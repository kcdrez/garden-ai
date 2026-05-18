import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { GardenBed } from '@/types/gardens';
import { formatDimensions, bedHasDetails } from '@/lib/beds';
import { routes } from '@/lib/routes';
import BedDetails from '@/components/beds/BedDetails';
import { deleteBed } from '@/api/beds';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from '@/components/ui/card';
import CardActionsMenu from '@/components/ui/card-actions-menu';
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
    navigate(routes.bedDetail(gardenId, bed.id));
  }

  return (
    <>
      <Card className="cursor-pointer hover:bg-muted/40 transition-colors" onClick={handleCardClick}>
        <CardHeader>
          <CardTitle>{bed.name}</CardTitle>
          <CardDescription>{formatDimensions(bed)}</CardDescription>
          <CardAction>
            <CardActionsMenu
              label="Bed actions"
              onEdit={() => setEditOpen(true)}
              onDelete={() => deleteMutation.mutate()}
              isDeleting={deleteMutation.isPending}
            />
          </CardAction>
        </CardHeader>

        {bedHasDetails(bed) && (
          <CardContent>
            <BedDetails bed={bed} />
          </CardContent>
        )}
      </Card>

      <BedDialog gardenId={gardenId} bed={bed} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
