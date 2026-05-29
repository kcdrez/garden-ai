import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchBeds } from '@/api/beds';
import { fetchUserPlants } from '@/api/plants';
import BedGrid from '@/components/beds/BedGrid';
import BedDetailHeader from '@/components/beds/BedDetailHeader';
import { getErrorMessage } from '@/lib/errors';
import type { GardenBed } from '@/types/gardens';
import type { UserPlant } from '@/types/plants';
import { LoadingSpinner } from '@/components/ui/query-state';

export default function BedDetail() {
  const { id, bedId } = useParams<{ id: string; bedId: string }>();
  const queryClient = useQueryClient();

  const {
    data: bed,
    isLoading: bedLoading,
    error: bedError,
  } = useQuery({
    queryKey: ['beds', 'garden', id],
    queryFn: () => fetchBeds(id!),
    enabled: !!id,
    select: (beds) => beds.find((b) => b.id === bedId),
    initialData: () => {
      const allBeds = queryClient.getQueryData<GardenBed[]>(['beds', 'all']);
      return allBeds?.filter((b) => b.garden === id);
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['beds', 'all'])?.dataUpdatedAt || Date.now(),
  });

  const { data: userPlants = [] } = useQuery({
    queryKey: ['plants', 'user', bedId],
    queryFn: () => fetchUserPlants(id!, bedId!),
    enabled: !!id && !!bedId,
    initialData: () => {
      const allPlants = queryClient.getQueryData<UserPlant[]>(['plants', 'user', 'all']);
      return allPlants?.filter((p) => p.bed === bedId);
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['plants', 'user', 'all'])?.dataUpdatedAt || Date.now(),
  });

  if (bedLoading) return <div className="p-5"><LoadingSpinner /></div>;
  if (bedError) return <div className="p-5 text-sm text-destructive">{getErrorMessage(bedError)}</div>;
  if (!bed) return null;

  return (
    <div className="p-5">
      <BedDetailHeader bed={bed} />

      <div className="mb-6">
        <h2 className="mb-3">Layout</h2>
        <BedGrid gardenId={id!} bedId={bedId!} bed={bed} userPlants={userPlants} />
      </div>
    </div>
  );
}
