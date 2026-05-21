import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon } from 'lucide-react';
import { fetchGardens } from '@/api/gardens';
import GardenItem from '@/components/gardens/GardenItem';
import GardenDialog from '@/components/gardens/GardenDialog';
import { Button } from '@/components/ui/button';
import { QueryState } from '@/components/ui/query-state';

export default function Gardens() {
  const [addOpen, setAddOpen] = useState(false);

  const { data: gardens = [], isLoading, error } = useQuery({
    queryKey: ['gardens'],
    queryFn: fetchGardens,
  });

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-6">
        <h2>Your Gardens</h2>
        <Button onClick={() => setAddOpen(true)}>
          <PlusIcon className="size-4" />
          Add Garden
        </Button>
      </div>

      <QueryState isLoading={isLoading} error={error} isEmpty={gardens.length === 0} emptyMessage="No gardens yet.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {gardens.map((g) => (
            <GardenItem key={g.id} garden={g} />
          ))}
        </div>
      </QueryState>

      <GardenDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
