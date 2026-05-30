import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBeds } from '@/api/beds';
import { fetchUserPlants } from '@/api/plants';
import type { GardenBed } from '@/types/gardens';
import type { UserPlant } from '@/types/plants';

export function useBedDetail(gardenId: string | undefined, bedId: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data: bed,
    isLoading: bedLoading,
    error: bedError,
  } = useQuery({
    queryKey: ['beds', 'garden', gardenId],
    queryFn: () => fetchBeds(gardenId!),
    enabled: !!gardenId,
    select: (beds) => beds.find((b) => b.id === bedId),
    initialData: () =>
      queryClient.getQueryData<GardenBed[]>(['beds', 'all'])?.filter((b) => b.garden === gardenId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['beds', 'all'])?.dataUpdatedAt ?? Date.now(),
  });

  const { data: userPlants = [] } = useQuery({
    queryKey: ['plants', 'user', bedId],
    queryFn: () => fetchUserPlants(gardenId!, bedId!),
    enabled: !!gardenId && !!bedId,
    initialData: () =>
      queryClient.getQueryData<UserPlant[]>(['plants', 'user', 'all'])?.filter((p) => p.bed === bedId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['plants', 'user', 'all'])?.dataUpdatedAt ?? Date.now(),
  });

  return { bed, userPlants, bedLoading, bedError };
}
