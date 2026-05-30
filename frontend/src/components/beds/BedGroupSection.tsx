import { Link } from 'react-router-dom';
import { ArrowRightIcon } from 'lucide-react';
import { routes } from '@/lib/routes';
import type { SortMode } from '@/hooks/useSortedList';
import type { GardenBed } from '@/types/gardens';
import BedItem from './BedItem';
import SortableGrid from '@/components/shared/SortableGrid';

interface BedGroupSectionProps {
  gardenId: string;
  gardenName: string;
  beds: GardenBed[];
  sortMode: SortMode;
  onReorder: (activeId: string, overId: string) => void;
}

export default function BedGroupSection({ gardenId, gardenName, beds, sortMode, onReorder }: BedGroupSectionProps) {
  return (
    <section>
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
        items={beds}
        sortMode={sortMode}
        onReorder={onReorder}
        renderItem={(bed) => <BedItem gardenId={gardenId} bed={bed} />}
      />
    </section>
  );
}
