import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchGarden } from '@/api/gardens';
import { fetchBeds } from '@/api/beds';
import type { Garden, GardenBed } from '@/types/gardens';

export function useGardenDetail(id: string | undefined) {
  const queryClient = useQueryClient();

  const {
    data: garden,
    isLoading: gardenLoading,
    error: gardenError,
  } = useQuery({
    queryKey: ['gardens', id],
    queryFn: () => fetchGarden(id!),
    enabled: !!id,
    initialData: () =>
      queryClient.getQueryData<Garden[]>(['gardens'])?.find((g) => g.id === id),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['gardens'])?.dataUpdatedAt ?? Date.now(),
  });

  const {
    data: beds = [],
    isLoading: bedsLoading,
    error: bedsError,
  } = useQuery({
    queryKey: ['beds', 'garden', id],
    queryFn: () => fetchBeds(id!),
    enabled: !!id,
    initialData: () =>
      queryClient.getQueryData<GardenBed[]>(['beds', 'all'])?.filter((b) => b.garden === id),
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['beds', 'all'])?.dataUpdatedAt ?? Date.now(),
  });

  return { garden, beds, gardenLoading, gardenError, bedsLoading, bedsError };
}
