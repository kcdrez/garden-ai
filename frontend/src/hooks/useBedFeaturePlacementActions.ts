import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBedFeatures, createBedFeature, updateBedFeature, deleteBedFeature } from '@/api/features';
import { makeOptimisticMutation } from '@/lib/mutations';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queryKeys';
import type { FeatureObjectType, GardenFeaturePlacement } from '@/types/gardens';

export function useBedFeaturePlacementActions(gardenId: string, bedId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.placements.bedFeatures(bedId);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data: features = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchBedFeatures(gardenId, bedId),
  });

  const createMutation = useMutation({
    mutationFn: (args: { objectType: FeatureObjectType; label?: string; x: number; y: number; width: number; height: number }) =>
      createBedFeature(gardenId, bedId, args),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const moveMutation = useMutation({
    mutationFn: ({ featureId, x, y }: { featureId: string; x: number; y: number }) =>
      updateBedFeature(gardenId, bedId, featureId, { x, y }),
    ...makeOptimisticMutation<GardenFeaturePlacement, { featureId: string; x: number; y: number }>(
      queryClient, queryKey,
      (vars) => vars.featureId,
      (item, { x, y }) => ({ ...item, x, y }),
      (err) => setMutationError(getErrorMessage(err)),
    ),
  });

  const resizeMutation = useMutation({
    mutationFn: ({ featureId, width, height }: { featureId: string; width: number; height: number }) =>
      updateBedFeature(gardenId, bedId, featureId, { width, height }),
    ...makeOptimisticMutation<GardenFeaturePlacement, { featureId: string; width: number; height: number }>(
      queryClient, queryKey,
      (vars) => vars.featureId,
      (item, { width, height }) => ({ ...item, width, height }),
      (err) => setMutationError(getErrorMessage(err)),
    ),
  });

  const updateLabelMutation = useMutation({
    mutationFn: ({ featureId, label }: { featureId: string; label: string }) =>
      updateBedFeature(gardenId, bedId, featureId, { label }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (featureId: string) => deleteBedFeature(gardenId, bedId, featureId),
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
    updateFeatureLabel: (args: { featureId: string; label: string }) => updateLabelMutation.mutate(args),
    removeFeature: (featureId: string) => deleteMutation.mutate(featureId),
  };
}
