import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { BedSingleIcon } from 'lucide-react';
import type { GardenBed } from '@/types/gardens';
import { formatDimensions, bedHasDetails } from '@/lib/beds';
import { isCardNavigationSuppressed } from '@/lib/utils';
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
import { useConfirm } from '@/hooks/useConfirm';

type Props = {
  gardenId: string;
  bed: GardenBed;
};


export default function BedItem({ gardenId, bed }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteBed(gardenId, bed.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beds'] }),
  });

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete bed?',
      description: `"${bed.name}" and all its plants will be permanently deleted.`,
    });
    if (ok) deleteMutation.mutate();
  }

  function handleCardClick(e: React.MouseEvent) {
    if (isCardNavigationSuppressed(e)) return;
    navigate(routes.bedDetail(gardenId, bed.id));
  }

  return (
    <>
      <Card className="cursor-pointer hover:bg-muted/40 transition-colors" onClick={handleCardClick}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BedSingleIcon className="size-4 text-primary" />
            {bed.name}
          </CardTitle>
          <CardDescription>{formatDimensions(bed)}</CardDescription>
          <CardDescription>
            {bed.plantCount === 1 ? '1 plant' : `${bed.plantCount} plants`}
          </CardDescription>
          <CardAction>
            <CardActionsMenu
              label="Bed actions"
              onEdit={() => setEditOpen(true)}
              onDelete={handleDelete}
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
