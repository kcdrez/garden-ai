import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBeds } from '@/api/beds';
import { fetchUserPlants } from '@/api/plants';
import { queryKeys } from '@/lib/queryKeys';
import type { GardenBed } from '@/types/gardens';
import type { UserPlant } from '@/types/plants';

export function useBedDetail(gardenId: string | undefined, bedId: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data: bed,
    isLoading: bedLoading,
    error: bedError,
  } = useQuery({
    queryKey: queryKeys.beds.byGarden(gardenId!),
    queryFn: () => fetchBeds(gardenId!),
    enabled: !!gardenId,
    select: (beds) => beds.find((b) => b.id === bedId),
    initialData: () =>
      queryClient.getQueryData<GardenBed[]>(queryKeys.beds.byAll())?.filter((b) => b.garden === gardenId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(queryKeys.beds.byAll())?.dataUpdatedAt ?? Date.now(),
  });

  const { data: userPlants = [] } = useQuery({
    queryKey: queryKeys.plants.byBed(bedId!),
    queryFn: () => fetchUserPlants(gardenId!, bedId!),
    enabled: !!gardenId && !!bedId,
    initialData: () =>
      queryClient.getQueryData<UserPlant[]>(queryKeys.plants.userAll())?.filter((p) => p.bed === bedId),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(queryKeys.plants.userAll())?.dataUpdatedAt ?? Date.now(),
  });

  return { bed, userPlants, bedLoading, bedError };
}
