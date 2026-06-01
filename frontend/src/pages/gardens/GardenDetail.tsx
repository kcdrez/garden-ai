import { useParams } from 'react-router-dom';
import { useGardenDetail } from '@/hooks/useGardenDetail';
import { getErrorMessage } from '@/lib/errors';
import GardenDetailHeader from '@/components/gardens/GardenDetailHeader';
import GardenGrid from '@/components/gardens/GardenGrid';
import { LoadingSpinner } from '@/components/ui/query-state';

export default function GardenDetail() {
  const { id } = useParams<{ id: string }>();
  const { garden, beds, gardenLoading, gardenError, bedsError } = useGardenDetail(id);

  if (gardenLoading) return <div className="p-5"><LoadingSpinner /></div>;
  if (gardenError) return <div className="p-5 text-sm text-destructive">{getErrorMessage(gardenError)}</div>;
  if (!garden) return null;

  return (
    <div className="p-5">
      <div className="mb-6">
        <GardenDetailHeader garden={garden} />
      </div>
      {bedsError && <p className="mb-4 text-sm text-destructive">{getErrorMessage(bedsError)}</p>}
      <div className="mb-6">
        <h2 className="mb-3">Layout</h2>
        <GardenGrid gardenId={id!} garden={garden} beds={beds} />
      </div>
    </div>
  );
}
