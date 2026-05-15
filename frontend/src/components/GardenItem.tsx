import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Garden } from '../types/gardens';
import { deleteGarden } from '../api/gardens';
import { Button } from '@/components/ui/button';

type Props = {
  garden: Garden;
};

export default function GardenItem({ garden }: Props) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteGarden(garden.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gardens'] }),
  });

  return (
    <li className="mb-2">
      <div className="flex items-center gap-3">
        <div>
          <strong>{garden.name}</strong>
          {garden.description && <div className="text-sm">{garden.description}</div>}
          <div className="text-muted-foreground text-xs">{garden.created_at}</div>
        </div>
        <div className="ml-auto">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </li>
  );
}
