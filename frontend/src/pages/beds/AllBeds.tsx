import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRightIcon, PlusIcon } from 'lucide-react';
import { arrayMove } from '@dnd-kit/sortable';
import { fetchAllBeds } from '@/api/beds';
import { groupByGarden } from '@/lib/beds';
import { routes } from '@/lib/routes';
import { sortItems } from '@/hooks/useSortedList';
import type { SortMode } from '@/hooks/useSortedList';
import { Button } from '@/components/ui/button';
import BedItem from '@/components/beds/BedItem';
import BedDialog from '@/components/beds/BedDialog';
import SortDropdown from '@/components/shared/SortDropdown';
import SortableGrid from '@/components/shared/SortableGrid';
import { QueryState } from '@/components/ui/query-state';
import type { GardenBed } from '@/types/gardens';

function readOrder(gardenId: string): string[] {
  try {
    const raw = localStorage.getItem(`garden-${gardenId}-beds-order`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeOrder(gardenId: string, order: string[]): void {
  localStorage.setItem(`garden-${gardenId}-beds-order`, JSON.stringify(order));
}

// _version is a cache-bust param — callers pass reorderVersion so React re-runs this on drag
function applySortToGroup(beds: GardenBed[], mode: SortMode, gardenId: string, _version?: number): GardenBed[] {
  if (mode !== 'custom') return sortItems(beds, mode);

  const order = readOrder(gardenId);
  if (order.length === 0) return beds;

  const orderMap = new Map(order.map((id, i) => [id, i]));
  const known = beds.filter((b) => orderMap.has(b.id));
  const unknown = beds.filter((b) => !orderMap.has(b.id));
  known.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
  return [...known, ...unknown];
}

export default function AllBeds() {
  const [addOpen, setAddOpen] = useState(false);
  const [reorderVersion, setReorderVersion] = useState(0);
  const [sortMode, setSortModeState] = useState<SortMode>(() => {
    try {
      return (localStorage.getItem('beds-all-sort') as SortMode) ?? 'name-asc';
    } catch {
      return 'name-asc';
    }
  });

  const { data: beds = [], isLoading, error } = useQuery({
    queryKey: ['beds', 'all'],
    queryFn: fetchAllBeds,
  });

  const grouped = groupByGarden(beds);

  function handleSortChange(mode: SortMode) {
    setSortModeState(mode);
    localStorage.setItem('beds-all-sort', mode);
    if (mode === 'custom') {
      grouped.forEach(({ gardenId, beds: gardenBeds }) => {
        if (readOrder(gardenId).length === 0) {
          writeOrder(gardenId, sortItems(gardenBeds, 'name-asc').map((b) => b.id));
        }
      });
    }
  }

  const handleReorder = useCallback((gardenId: string, activeId: string, overId: string) => {
    const order = readOrder(gardenId);
    const oldIndex = order.indexOf(activeId);
    const newIndex = order.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(order, oldIndex, newIndex);
    writeOrder(gardenId, next);
    setReorderVersion((v) => v + 1);
  }, []);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-6">
        <h1>Your Beds</h1>
        <div className="flex items-center gap-2">
          <SortDropdown value={sortMode} onChange={handleSortChange} />
          <Button onClick={() => setAddOpen(true)}>
            <PlusIcon className="size-4" />
            Add Bed
          </Button>
        </div>
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
                <h2>{gardenName}</h2>
                <Link
                  to={routes.gardenDetail(gardenId)}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowRightIcon className="size-3.5" />
                  View garden
                </Link>
              </div>

              <SortableGrid
                items={applySortToGroup(gardenBeds, sortMode, gardenId, reorderVersion)}
                sortMode={sortMode}
                onReorder={(activeId, overId) => handleReorder(gardenId, activeId, overId)}
                renderItem={(bed) => <BedItem gardenId={gardenId} bed={bed} />}
              />
            </section>
          ))}
        </div>
      </QueryState>

      <BedDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
