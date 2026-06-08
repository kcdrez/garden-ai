import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchGarden } from '@/api/gardens';
import { fetchBeds } from '@/api/beds';
import { queryKeys } from '@/lib/queryKeys';
import type { Garden, GardenBed } from '@/types/gardens';

export function useGardenDetail(id: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data: garden,
    isLoading: gardenLoading,
    error: gardenError,
  } = useQuery({
    queryKey: queryKeys.gardens.detail(id!),
    queryFn: () => fetchGarden(id!),
    enabled: !!id,
    initialData: () =>
      queryClient.getQueryData<Garden[]>(queryKeys.gardens.list())?.find((g) => g.id === id),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(queryKeys.gardens.list())?.dataUpdatedAt ?? Date.now(),
  });

  const {
    data: beds = [],
    isLoading: bedsLoading,
    error: bedsError,
  } = useQuery({
    queryKey: queryKeys.beds.byGarden(id!),
    queryFn: () => fetchBeds(id!),
    enabled: !!id,
    initialData: () =>
      queryClient.getQueryData<GardenBed[]>(queryKeys.beds.byAll())?.filter((b) => b.garden === id),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(queryKeys.beds.byAll())?.dataUpdatedAt ?? Date.now(),
  });

  return { garden, beds, gardenLoading, gardenError, bedsLoading, bedsError };
}
