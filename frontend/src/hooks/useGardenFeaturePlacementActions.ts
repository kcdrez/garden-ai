import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGardenFeatures, createGardenFeature, updateGardenFeature, deleteGardenFeature } from '@/api/features';
import { makeOptimisticMutation } from '@/lib/mutations';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import type { FeatureObjectType, GardenFeaturePlacement } from '@/types/gardens';

export function useGardenFeaturePlacementActions(gardenId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.placements.gardenFeatures(gardenId);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data: features = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchGardenFeatures(gardenId),
  });

  const createMutation = useMutation({
    mutationFn: (args: { objectType: FeatureObjectType; label?: string; x: number; y: number; width: number; height: number }) =>
      createGardenFeature(gardenId, args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const moveMutation = useMutation({
    mutationFn: ({ featureId, x, y }: { featureId: string; x: number; y: number }) =>
      updateGardenFeature(gardenId, featureId, { x, y }),
    ...makeOptimisticMutation<GardenFeaturePlacement, { featureId: string; x: number; y: number }>(
      queryClient, queryKey,
      (vars) => vars.featureId,
      (item, { x, y }) => ({ ...item, x, y }),
      (err) => setMutationError(getErrorMessage(err)),
    ),
  });

  const resizeMutation = useMutation({
    mutationFn: ({ featureId, width, height }: { featureId: string; width: number; height: number }) =>
      updateGardenFeature(gardenId, featureId, { width, height }),
    ...makeOptimisticMutation<GardenFeaturePlacement, { featureId: string; width: number; height: number }>(
      queryClient, queryKey,
      (vars) => vars.featureId,
      (item, { width, height }) => ({ ...item, width, height }),
      (err) => setMutationError(getErrorMessage(err)),
    ),
  });

  const rotateMutation = useMutation({
    mutationFn: ({ featureId, rotation }: { featureId: string; rotation: number }) =>
      updateGardenFeature(gardenId, featureId, { rotation }),
    ...makeOptimisticMutation<GardenFeaturePlacement, { featureId: string; rotation: number }>(
      queryClient, queryKey,
      (vars) => vars.featureId,
      (item, { rotation }) => ({ ...item, rotation }),
      (err) => setMutationError(getErrorMessage(err)),
    ),
  });

  const updateLabelMutation = useMutation({
    mutationFn: ({ featureId, label }: { featureId: string; label: string }) =>
      updateGardenFeature(gardenId, featureId, { label }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (featureId: string) => deleteGardenFeature(gardenId, featureId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: (err) => setMutationError(getErrorMessage(err)),
  });

  return {
    features,
    isLoading,
    mutationError,
    createFeature: (
      args: { objectType: FeatureObjectType; label?: string; x: number; y: number; width: number; height: number },
      onSuccess?: () => void,
    ) => createMutation.mutate(args, { onSuccess }),
    moveFeature: (args: { featureId: string; x: number; y: number }) => moveMutation.mutate(args),
    resizeFeature: (args: { featureId: string; width: number; height: number }) => resizeMutation.mutate(args),
    rotateFeature: (args: { featureId: string; rotation: number }) => rotateMutation.mutate(args),
    updateFeatureLabel: (args: { featureId: string; label: string }) => updateLabelMutation.mutate(args),
    removeFeature: (featureId: string) => deleteMutation.mutate(featureId),
  };
}
