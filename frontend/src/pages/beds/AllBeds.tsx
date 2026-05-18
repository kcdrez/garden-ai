import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightIcon } from 'lucide-react';
import { fetchAllBeds } from '@/api/beds';
import type { GardenBed } from '@/types/gardens';
import { formatDimensions, bedHasDetails } from '@/lib/beds';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import BedDetails from '@/components/beds/BedDetails';
import { QueryState } from '@/components/ui/query-state';

type BedsByGarden = { gardenId: string; gardenName: string; beds: GardenBed[] }[];

function groupByGarden(beds: GardenBed[]): BedsByGarden {
  const map = new Map<string, { gardenName: string; beds: GardenBed[] }>();
  for (const bed of beds) {
    if (!map.has(bed.garden)) {
      map.set(bed.garden, { gardenName: bed.gardenName, beds: [] });
    }
    map.get(bed.garden)!.beds.push(bed);
  }
  return Array.from(map.entries()).map(([gardenId, { gardenName, beds }]) => ({
    gardenId,
    gardenName,
    beds,
  }));
}

export default function AllBeds() {
  const { data: beds = [], isLoading, error } = useQuery({
    queryKey: ['beds', 'all'],
    queryFn: fetchAllBeds,
  });

  const grouped = groupByGarden(beds);

  return (
    <div className="p-5">
      <h2 className="mb-6">All Beds</h2>

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
                  to={`/gardens/${gardenId}`}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowRightIcon className="size-3.5" />
                  View garden
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gardenBeds.map((bed) => {
                  return (
                    <Link
                      key={bed.id}
                      to={`/gardens/${gardenId}/beds/${bed.id}`}
                      className="no-underline"
                    >
                      <Card className="cursor-pointer hover:bg-muted/40 transition-colors h-full">
                        <CardHeader>
                          <CardTitle>{bed.name}</CardTitle>
                          <CardDescription>{formatDimensions(bed)}</CardDescription>
                        </CardHeader>
                        {bedHasDetails(bed, false) && (
                          <CardContent>
                            <BedDetails bed={bed} showNotes={false} />
                          </CardContent>
                        )}
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </QueryState>
    </div>
  );
}
