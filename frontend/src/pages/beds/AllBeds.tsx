import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightIcon, PlusIcon } from 'lucide-react';
import { fetchAllBeds } from '@/api/beds';
import { groupByGarden } from '@/lib/beds';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import BedItem from '@/components/beds/BedItem';
import BedDialog from '@/components/beds/BedDialog';
import { QueryState } from '@/components/ui/query-state';

export default function AllBeds() {
  const [addOpen, setAddOpen] = useState(false);

  const { data: beds = [], isLoading, error } = useQuery({
    queryKey: ['beds', 'all'],
    queryFn: fetchAllBeds,
  });

  const grouped = groupByGarden(beds);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-6">
        <h2>Your Beds</h2>
        <Button onClick={() => setAddOpen(true)}>
          <PlusIcon className="size-4" />
          Add Bed
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={beds.length === 0}
        emptyMessage="No beds yet. Add one from a garden page."
      >
        <div className="flex flex-col gap-8">
          {grouped.map(({ gardenId, gardenName, beds: gardenBeds }) => (
            <section key={gardenId}>
              <div className="flex items-center gap-2 mb-3">
                <h3>{gardenName}</h3>
                <Link
                  to={routes.gardenDetail(gardenId)}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowRightIcon className="size-3.5" />
                  View garden
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gardenBeds.map((bed) => (
                  <BedItem key={bed.id} gardenId={gardenId} bed={bed} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </QueryState>

      <BedDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
