import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LeafIcon, GripVerticalIcon } from 'lucide-react';
import type { Garden } from '@/types/gardens';
import { deleteGarden } from '@/api/gardens';
import { routes } from '@/lib/routes';
import { isCardNavigationSuppressed } from '@/lib/utils';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/components/ui/card';
import CardActionsMenu from '@/components/ui/card-actions-menu';
import GardenDialog from '@/components/gardens/GardenDialog';
import { useConfirm } from '@/hooks/useConfirm';

type Props = {
  garden: Garden;
  isDraggable?: boolean;
};

export default function GardenItem({ garden, isDraggable = false }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteGarden(garden.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gardens'] }),
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
      <Card
        className="cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={(e) => {
          if (isCardNavigationSuppressed(e)) return;
          navigate(routes.gardenDetail(garden.id));
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDraggable
              ? <GripVerticalIcon className="size-4 text-muted-foreground shrink-0" />
              : <LeafIcon className="size-4 text-primary shrink-0" />
            }
            <Link
              to={routes.gardenDetail(garden.id)}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              {garden.name}
            </Link>
          </CardTitle>
          {garden.description && (
            <CardDescription className="line-clamp-2">
              {garden.description}
            </CardDescription>
          )}
          {garden.length && garden.width && (
            <CardDescription>
              {garden.length} × {garden.width} {garden.unit}
            </CardDescription>
          )}
          <CardDescription>
            {garden.bedCount === 1 ? '1 bed' : `${garden.bedCount} beds`}
          </CardDescription>
          <CardAction>
            <CardActionsMenu
              label={`${garden.name} actions`}
              onEdit={() => setEditOpen(true)}
              onDelete={handleDelete}
              isDeleting={deleteMutation.isPending}
            />
          </CardAction>
        </CardHeader>

      </Card>
      <GardenDialog
        garden={garden}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
