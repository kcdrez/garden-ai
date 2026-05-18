import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { LeafIcon } from 'lucide-react';
import { fetchAllUserPlants } from '@/api/plants';
import { USER_PLANT_STATUSES } from '@/types/plants';
import { QueryState } from '@/components/ui/query-state';

const STATUS_CLASSES: Record<string, string> = {
  planned: 'bg-muted text-muted-foreground',
  planted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  growing: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  harvested: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  removed: 'bg-muted text-muted-foreground line-through',
};

function statusLabel(value: string): string {
  return USER_PLANT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export default function AllPlants() {
  const { data: userPlants = [], isLoading, error } = useQuery({
    queryKey: ['plants', 'user', 'all'],
    queryFn: fetchAllUserPlants,
  });

  return (
    <div className="p-5">
      <h2 className="mb-6">All Plants</h2>

      <QueryState
        isLoading={isLoading}
        error={error}
        isEmpty={userPlants.length === 0}
        emptyMessage="No plants yet. Add some from a bed page."
      >
        <ul className="flex flex-col divide-y divide-border">
          {userPlants.map((up) => (
            <li key={up.id} className="flex items-center justify-between py-3 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <LeafIcon className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{up.plantName}</span>
                    {up.variety && (
                      <span className="text-muted-foreground text-sm">— {up.variety}</span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASSES[up.status] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {statusLabel(up.status)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    <Link
                      to={`/gardens/${up.gardenId}/beds/${up.bed}`}
                      className="hover:text-foreground"
                    >
                      {up.bedName}
                    </Link>
                    <span className="mx-1">·</span>
                    <Link to={`/gardens/${up.gardenId}`} className="hover:text-foreground">
                      {up.gardenName}
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </QueryState>
    </div>
  );
}
