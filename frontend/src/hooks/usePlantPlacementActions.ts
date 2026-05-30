import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchPlacements, createPlacement, movePlacement, resizePlacement,
  deletePlacement, cloneUserPlant, deleteUserPlant,
} from '@/api/plants';
import { makeOptimisticMutation } from '@/lib/mutations';
import { getErrorMessage } from '@/lib/errors';
import type { PlantPlacement } from '@/types/plants';

export function usePlantPlacementActions(gardenId: string, bedId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['placements', bedId] as const;
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data: placements = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchPlacements(gardenId, bedId),
  });

  const createMutation = useMutation({
    mutationFn: ({ userPlantId, x, y, width, height }: { userPlantId: string; x: number; y: number; width: number; height: number }) =>
      createPlacement(gardenId, bedId, { userPlant: userPlantId, x, y, width, height }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const moveMutation = useMutation({
    mutationFn: ({ placementId, x, y }: { placementId: string; x: number; y: number }) =>
      movePlacement(gardenId, bedId, placementId, x, y),
    ...makeOptimisticMutation<PlantPlacement, { placementId: string; x: number; y: number }>(
      queryClient, queryKey,
      (item, { x, y }) => ({ ...item, x, y }),
      (err) => setMutationError(getErrorMessage(err)),
    ),
  });

  const resizeMutation = useMutation({
    mutationFn: ({ placementId, widthFt, heightFt }: { placementId: string; widthFt: number; heightFt: number }) =>
      resizePlacement(gardenId, bedId, placementId, widthFt, heightFt),
    ...makeOptimisticMutation<PlantPlacement, { placementId: string; widthFt: number; heightFt: number }>(
      queryClient, queryKey,
      (item, { widthFt, heightFt }) => ({ ...item, width: widthFt, height: heightFt }),
      (err) => setMutationError(getErrorMessage(err)),
    ),
  });

  const removePlacementMutation = useMutation({
    mutationFn: ({ placementId }: { placementId: string }) =>
      deletePlacement(gardenId, bedId, placementId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (err) => setMutationError(getErrorMessage(err)),
  });

  const cloneUserPlantMutation = useMutation({
    mutationFn: ({ plantId, placement }: { plantId: string; placement?: { x: number; y: number; width: number; height: number } }) =>
      cloneUserPlant(gardenId, bedId, plantId, placement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants', 'user', bedId] });
      queryClient.invalidateQueries({ queryKey: ['plants', 'user'] });
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err) => setMutationError(getErrorMessage(err)),
  });

  const deleteUserPlantMutation = useMutation({
    mutationFn: ({ plantId }: { plantId: string }) =>
      deleteUserPlant(gardenId, bedId, plantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['plants', 'user'] });
      setMutationError(null);
    },
    onError: (err) => setMutationError(getErrorMessage(err)),
  });

  return {
    placements,
    isLoading,
    mutationError,
    createPlacement: (
      args: { userPlantId: string; x: number; y: number; width: number; height: number },
      onSuccess?: () => void,
    ) => createMutation.mutate(args, { onSuccess }),
    movePlacement: (args: { placementId: string; x: number; y: number }) => moveMutation.mutate(args),
    resizePlacement: (args: { placementId: string; widthFt: number; heightFt: number }) => resizeMutation.mutate(args),
    removePlacement: (placementId: string) => removePlacementMutation.mutate({ placementId }),
    clonePlant: (args: { plantId: string; placement?: { x: number; y: number; width: number; height: number } }) =>
      cloneUserPlantMutation.mutate(args),
    deletePlant: (plantId: string) => deleteUserPlantMutation.mutate({ plantId }),
    isCreating: createMutation.isPending,
    createFailed: createMutation.isError,
    createError: createMutation.error,
    resetCreate: () => createMutation.reset(),
    isDeleting: deleteUserPlantMutation.isPending,
  };
}
