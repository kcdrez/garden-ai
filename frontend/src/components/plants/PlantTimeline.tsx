import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { fetchObservations } from '@/api/plants';
import { queryKeys } from '@/lib/queryKeys';
import type { UserPlant } from '@/types/plants';
import { Button } from '@/components/ui/button';
import StatusChips from '@/components/plants/StatusChips';
import ObservationList from '@/components/plants/ObservationList';
import ObservationForm from '@/components/plants/ObservationForm';

type Props = {
  gardenId: string;
  bedId: string;
  plant: UserPlant;
};

export default function PlantTimeline({ gardenId, bedId, plant }: Props) {
  const [showForm, setShowForm] = useState(false);

  const { data: observations = [], isLoading, error } = useQuery({
    queryKey: queryKeys.observations.detail(plant.id, gardenId, bedId),
    queryFn: () => fetchObservations(gardenId, bedId, plant.id),
  });

  return (
    <div className="mt-2 ml-5 pl-4 border-l border-border space-y-4 pb-2">
      <StatusChips gardenId={gardenId} bedId={bedId} plant={plant} />

      <ObservationList
        gardenId={gardenId}
        bedId={bedId}
        plantId={plant.id}
        observations={observations}
        isLoading={isLoading}
        error={error}
      />

      {showForm ? (
        <ObservationForm
          gardenId={gardenId}
          bedId={bedId}
          plantId={plant.id}
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
          <PlusIcon className="size-3.5" />
          Add Observation
        </Button>
      )}
    </div>
  );
}
