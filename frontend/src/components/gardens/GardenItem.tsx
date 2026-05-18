import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LeafIcon } from 'lucide-react';
import type { Garden } from '@/types/gardens';
import { deleteGarden } from '@/api/gardens';
import { formatDate } from '@/lib/dates';
import { routes } from '@/lib/routes';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter,
} from '@/components/ui/card';
import CardActionsMenu from '@/components/ui/card-actions-menu';
import EditGardenDialog from '@/components/gardens/EditGardenDialog';

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
        <CardAction>
          <CardActionsMenu
            label="Garden actions"
            onEdit={() => setEditOpen(true)}
            onDelete={() => deleteMutation.mutate()}
            isDeleting={deleteMutation.isPending}
          />
        </CardAction>
      </CardHeader>
      <CardFooter className="mt-auto">
        <span className="text-xs text-muted-foreground">
          Created {formatDate(garden.createdAt)}
        </span>
      </CardFooter>
      <EditGardenDialog
        garden={garden}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </Card>
  );
}
