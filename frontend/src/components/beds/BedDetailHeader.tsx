import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { deleteBed } from '@/api/beds';
import { formatDimensions, bedHasDetails } from '@/lib/beds';
import { routes } from '@/lib/routes';
import type { GardenBed } from '@/types/gardens';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import BedDetails from '@/components/beds/BedDetails';
import BedEditForm from '@/components/beds/BedEditForm';
import { useConfirm } from '@/hooks/useConfirm';

type Props = {
  bed: GardenBed;
};

export default function BedDetailHeader({ bed }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteBed(bed.garden, bed.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      navigate(routes.gardenDetail(bed.garden));
    },
  });

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete bed?',
      description: `"${bed.name}" and all its plants will be permanently deleted.`,
    });
    if (ok) deleteMutation.mutate();
  }

  return (
    <>
      <Link
        to={routes.gardenDetail(bed.garden)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeftIcon className="size-4" />
        {bed.gardenName}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1>{bed.name}</h1>
          <p className="text-muted-foreground mt-1">{formatDimensions(bed)}</p>
        </div>
        <div className="flex gap-2">
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

      {bedHasDetails(bed) && (
        <Card className="mb-6">
          <CardContent>
            <BedDetails bed={bed} />
          </CardContent>
        </Card>
      )}

      <BedEditForm bed={bed} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
