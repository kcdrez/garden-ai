import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cloneUserPlant, deleteUserPlant } from '@/api/plants';
import type { UserPlant } from '@/types/plants';
import { useConfirm } from '@/hooks/useConfirm';

export function usePlantActions(plant: UserPlant, options?: { onDeleteSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [editOpen, setEditOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);

  const cloneMutation = useMutation({
    mutationFn: () => cloneUserPlant(plant.gardenId, plant.bed, plant.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['plants', 'user'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUserPlant(plant.gardenId, plant.bed, plant.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants', 'user'] });
      options?.onDeleteSuccess?.();
    },
  });

  async function handleDelete() {
    const ok = await confirm({
      title: 'Delete plant?',
      description: `"${plant.plantName}${plant.variety ? ` — ${plant.variety}` : ''}" will be permanently deleted.`,
    });
    if (ok) deleteMutation.mutate();
  }

  return {
    editOpen,
    setEditOpen,
    moveOpen,
    setMoveOpen,
    cloneMutation,
    deleteMutation,
    handleDelete,
  };
}
