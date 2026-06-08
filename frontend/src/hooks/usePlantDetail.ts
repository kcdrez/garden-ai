import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUserPlant } from '@/api/plants';
import { queryKeys } from '@/lib/queryKeys';
import type { UserPlant } from '@/types/plants';

export function usePlantDetail(plantId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: plant, isLoading, error } = useQuery({
    queryKey: queryKeys.plants.detail(plantId!),
    queryFn: () => fetchUserPlant(plantId!),
    enabled: !!plantId,
    initialData: () =>
      queryClient.getQueryData<UserPlant[]>(queryKeys.plants.userAll())?.find((p) => p.id === plantId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(queryKeys.plants.userAll())?.dataUpdatedAt ?? Date.now(),
  });

  return { plant, isLoading, error };
}
