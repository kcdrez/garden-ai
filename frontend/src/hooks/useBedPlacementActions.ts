import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBedPlacements, createBedPlacement, moveBedPlacement, rotateBedPlacement, deleteBedPlacement } from '@/api/beds';
import { makeOptimisticMutation } from '@/lib/mutations';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import type { BedPlacement } from '@/types/gardens';

export function useBedPlacementActions(gardenId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.placements.garden(gardenId);
  const [mutationError, setMutationError] = useState<string | null>(null);

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
      (vars) => vars.placementId,
      (item, { x, y }) => ({ ...item, x, y }),
      (err) => setMutationError(getErrorMessage(err)),
    ),
  });

  const rotateMutation = useMutation({
    mutationFn: ({ placementId, rotation }: { placementId: string; rotation: number }) =>
      rotateBedPlacement(gardenId, placementId, rotation),
    ...makeOptimisticMutation<BedPlacement, { placementId: string; rotation: number }>(
      queryClient, queryKey,
      (vars) => vars.placementId,
      (item, { rotation }) => ({ ...item, rotation }),
      (err) => setMutationError(getErrorMessage(err)),
    ),
  });

  const deleteMutation = useMutation({
    mutationFn: (placementId: string) => deleteBedPlacement(gardenId, placementId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (err) => setMutationError(getErrorMessage(err)),
  });

  return {
    placements,
    isLoading,
    mutationError,
    createPlacement: (args: { bedId: string; x: number; y: number }, onSuccess?: () => void) =>
      createMutation.mutate(args, { onSuccess }),
    movePlacement: (args: { placementId: string; x: number; y: number }) => moveMutation.mutate(args),
    rotatePlacement: (args: { placementId: string; rotation: number }) => rotateMutation.mutate(args),
    removePlacement: (placementId: string) => deleteMutation.mutate(placementId),
    isCreating: createMutation.isPending,
    createFailed: createMutation.isError,
    createError: createMutation.error,
    resetCreate: () => createMutation.reset(),
  };
}
