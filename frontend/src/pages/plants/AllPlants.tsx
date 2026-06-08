import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { fetchAllUserPlants } from '@/api/plants';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/button';
import { QueryState } from '@/components/ui/query-state';
import PlantItem from '@/components/plants/PlantItem';
import UserPlantDialog from '@/components/plants/UserPlantDialog';

export default function AllPlants() {
  const [addOpen, setAddOpen] = useState(false);

  const { data: userPlants = [], isLoading, error } = useQuery({
    queryKey: queryKeys.plants.userAll(),
    queryFn: fetchAllUserPlants,
  });

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-6">
        <h1>Your Plants</h1>
        <Button onClick={() => setAddOpen(true)}>
          <PlusIcon className="size-4" />
          Add Plant
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={userPlants.length === 0}
        emptyMessage="No plants yet. Add some from a bed page."
      >
        <ul className="flex flex-col divide-y divide-border">
          {userPlants.map((plant) => (
            <PlantItem key={plant.id} plant={plant} />
          ))}
        </ul>
      </QueryState>

      <UserPlantDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
