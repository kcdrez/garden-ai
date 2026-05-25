import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchUserPlant } from '@/api/plants';
import PlantDetailHeader from '@/components/plants/PlantDetailHeader';
import PlantTimeline from '@/components/plants/PlantTimeline';
import { LoadingSpinner } from '@/components/ui/query-state';
import { getErrorMessage } from '@/lib/errors';
import type { UserPlant } from '@/types/plants';

export default function PlantDetail() {
  const { plantId } = useParams<{ plantId: string }>();
  const queryClient = useQueryClient();

  const { data: plant, isLoading, error } = useQuery({
    queryKey: ['plants', 'user', 'detail', plantId],
    queryFn: () => fetchUserPlant(plantId!),
    enabled: !!plantId,
    initialData: () => {
      const all = queryClient.getQueryData<UserPlant[]>(['plants', 'user', 'all']);
      return all?.find((p) => p.id === plantId);
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['plants', 'user', 'all'])?.dataUpdatedAt || Date.now(),
  });

  if (isLoading) return <div className="p-5"><LoadingSpinner /></div>;
  if (error) return <div className="p-5 text-sm text-destructive">{getErrorMessage(error)}</div>;
  if (!plant) return null;

  return (
    <div className="p-5">
      <PlantDetailHeader plant={plant} />
      <div>
        <h2 className="mb-3">Timeline</h2>
        <PlantTimeline gardenId={plant.gardenId} bedId={plant.bed} plant={plant} />
      </div>
    </div>
  );
}
