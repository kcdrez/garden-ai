import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { deleteGarden } from '@/api/gardens';
import { queryKeys } from '@/lib/queryKeys';
import type { Garden } from '@/types/gardens';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { useConfirm } from '@/hooks/useConfirm';
import GardenEditForm from '@/components/gardens/GardenEditForm';

type Props = {
  garden: Garden;
};

export default function GardenDetailHeader({ garden }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteGarden(garden.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.gardens.list() });
      navigate(routes.gardens());
    },
  });

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete garden?',
      description: `"${garden.name}" and all its beds and plants will be permanently deleted.`,
    });
    if (ok) deleteMutation.mutate();
  }

  return (
    <>
      <Link
        to={routes.gardens()}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeftIcon className="size-4" />
        Your Gardens
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1>{garden.name}</h1>
          {garden.description && (
            <p className="text-muted-foreground mt-1">{garden.description}</p>
          )}
          {garden.length != null && garden.width != null && (
            <p className="text-muted-foreground mt-1">{garden.length} × {garden.width} {garden.unit}</p>
          )}
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

      <GardenEditForm garden={garden} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
