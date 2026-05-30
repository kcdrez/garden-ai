import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUserPlant } from '@/api/plants';
import type { UserPlant } from '@/types/plants';

export function usePlantDetail(plantId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: plant, isLoading, error } = useQuery({
    queryKey: ['plants', 'user', 'detail', plantId],
    queryFn: () => fetchUserPlant(plantId!),
    enabled: !!plantId,
    initialData: () =>
      queryClient.getQueryData<UserPlant[]>(['plants', 'user', 'all'])?.find((p) => p.id === plantId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['plants', 'user', 'all'])?.dataUpdatedAt ?? Date.now(),
  });

  return { plant, isLoading, error };
}
