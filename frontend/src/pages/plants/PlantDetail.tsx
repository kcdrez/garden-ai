import { useParams } from 'react-router-dom';
import { usePlantDetail } from '@/hooks/usePlantDetail';
import PlantDetailHeader from '@/components/plants/PlantDetailHeader';
import PlantTimeline from '@/components/plants/PlantTimeline';
import { LoadingSpinner } from '@/components/ui/query-state';
import { getErrorMessage } from '@/lib/errors';

export default function PlantDetail() {
  const { plantId } = useParams<{ plantId: string }>();
  const { plant, isLoading, error } = usePlantDetail(plantId);

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
