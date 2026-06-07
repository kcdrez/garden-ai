import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGardenFeatures, createGardenFeature, updateGardenFeature, deleteGardenFeature } from '@/api/features';
import type { FeatureObjectType, GardenFeaturePlacement } from '@/types/gardens';

type Context = { previous?: GardenFeaturePlacement[] };

export function useGardenFeaturePlacementActions(gardenId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['garden-features', gardenId] as const;

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
    ...optimistic<{ x: number; y: number }>((item, { x, y }) => ({ ...item, x, y })),
  });

  const resizeMutation = useMutation({
    mutationFn: ({ featureId, width, height }: { featureId: string; width: number; height: number }) =>
      updateGardenFeature(gardenId, featureId, { width, height }),
    ...optimistic<{ width: number; height: number }>((item, { width, height }) => ({ ...item, width, height })),
  });

  const updateLabelMutation = useMutation({
    mutationFn: ({ featureId, label }: { featureId: string; label: string }) =>
      updateGardenFeature(gardenId, featureId, { label }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: (featureId: string) => deleteGardenFeature(gardenId, featureId),
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
