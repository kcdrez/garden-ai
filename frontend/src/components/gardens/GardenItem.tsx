import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LeafIcon } from 'lucide-react';
import type { Garden } from '@/types/gardens';
import { deleteGarden } from '@/api/gardens';
import { routes } from '@/lib/routes';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/components/ui/card';
import CardActionsMenu from '@/components/ui/card-actions-menu';
import GardenDialog from '@/components/gardens/GardenDialog';

type Props = {
  garden: Garden;
};

export default function GardenItem({ garden }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteGarden(garden.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gardens'] }),
  });

  return (
    <>
      <Card
        className="cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-radix-popper-content-wrapper], [role="menu"], button')) return;
          navigate(routes.gardenDetail(garden.id));
        }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LeafIcon className="size-4 text-primary" />
            {garden.name}
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
              label="Garden actions"
              onEdit={() => setEditOpen(true)}
              onDelete={() => deleteMutation.mutate()}
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
