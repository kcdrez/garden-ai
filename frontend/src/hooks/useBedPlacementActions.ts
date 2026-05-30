import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBedPlacements, createBedPlacement, moveBedPlacement, deleteBedPlacement } from '@/api/beds';
import { makeOptimisticMutation } from '@/lib/mutations';
import type { BedPlacement } from '@/types/gardens';

export function useBedPlacementActions(gardenId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['bed-placements', gardenId] as const;

  const { data: placements = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchBedPlacements(gardenId),
  });

  const createMutation = useMutation({
    mutationFn: ({ bedId, x, y }: { bedId: string; x: number; y: number }) =>
      createBedPlacement(gardenId, { bed: bedId, x, y }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const moveMutation = useMutation({
    mutationFn: ({ placementId, x, y }: { placementId: string; x: number; y: number }) =>
      moveBedPlacement(gardenId, placementId, x, y),
    ...makeOptimisticMutation<BedPlacement, { placementId: string; x: number; y: number }>(
      queryClient, queryKey,
      (item, { x, y }) => ({ ...item, x, y }),
    ),
  });

  const deleteMutation = useMutation({
    mutationFn: (placementId: string) => deleteBedPlacement(gardenId, placementId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    placements,
    isLoading,
    createPlacement: (args: { bedId: string; x: number; y: number }) => createMutation.mutate(args),
    movePlacement: (args: { placementId: string; x: number; y: number }) => moveMutation.mutate(args),
    removePlacement: (placementId: string) => deleteMutation.mutate(placementId),
    isCreating: createMutation.isPending,
    createFailed: createMutation.isError,
    createError: createMutation.error,
    resetCreate: () => createMutation.reset(),
  };
}
