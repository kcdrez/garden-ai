import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBedFeatures, createBedFeature, updateBedFeature, deleteBedFeature } from '@/api/features';
import type { FeatureObjectType, GardenFeaturePlacement } from '@/types/gardens';

type Context = { previous?: GardenFeaturePlacement[] };

export function useBedFeaturePlacementActions(gardenId: string, bedId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['bed-features', bedId] as const;

  function optimistic<Vars>(applyUpdate: (item: GardenFeaturePlacement, vars: Vars & { featureId: string }) => GardenFeaturePlacement) {
    return {
      onMutate: async (vars: Vars & { featureId: string }): Promise<Context> => {
        await queryClient.cancelQueries({ queryKey });
        const previous = queryClient.getQueryData<GardenFeaturePlacement[]>(queryKey);
        queryClient.setQueryData<GardenFeaturePlacement[]>(queryKey, (old = []) =>
          old.map((item) => item.id === vars.featureId ? applyUpdate(item, vars) : item),
        );
        return { previous };
      },
      onError: (_err: unknown, _vars: Vars, context: Context | undefined) => {
        if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      },
      onSettled: () => queryClient.invalidateQueries({ queryKey }),
    };
  }

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
    ...optimistic<{ x: number; y: number }>((item, { x, y }) => ({ ...item, x, y })),
  });

  const resizeMutation = useMutation({
    mutationFn: ({ featureId, width, height }: { featureId: string; width: number; height: number }) =>
      updateBedFeature(gardenId, bedId, featureId, { width, height }),
    ...optimistic<{ width: number; height: number }>((item, { width, height }) => ({ ...item, width, height })),
  });

  const updateLabelMutation = useMutation({
    mutationFn: ({ featureId, label }: { featureId: string; label: string }) =>
      updateBedFeature(gardenId, bedId, featureId, { label }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (featureId: string) => deleteBedFeature(gardenId, bedId, featureId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    features,
    isLoading,
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
