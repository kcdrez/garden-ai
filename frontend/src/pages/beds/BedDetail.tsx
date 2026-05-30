import { useParams } from 'react-router-dom';
import { useBedDetail } from '@/hooks/useBedDetail';
import BedGrid from '@/components/beds/BedGrid';
import BedDetailHeader from '@/components/beds/BedDetailHeader';
import { getErrorMessage } from '@/lib/errors';
import { LoadingSpinner } from '@/components/ui/query-state';

export default function BedDetail() {
  const { id, bedId } = useParams<{ id: string; bedId: string }>();
  const { bed, userPlants, bedLoading, bedError } = useBedDetail(id, bedId);

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
