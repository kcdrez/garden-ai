import { CompassIcon, SunIcon, ShovelIcon, NotebookPenIcon } from 'lucide-react';
import type { GardenBed } from '@/types/gardens';
import { facingLabel, bedHasDetails } from '@/lib/beds';

type Props = {
  bed: GardenBed;
  showNotes?: boolean;
};

export default function BedDetails({ bed, showNotes = true }: Props) {
  if (!bedHasDetails(bed, showNotes)) return null;

  return (
    <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
      {bed.facing && (
        <span className="flex items-center gap-2">
          <CompassIcon className="size-3.5 shrink-0" />
          Faces {facingLabel(bed.facing)}
        </span>
      )}
      {bed.avgSunlightHours != null && (
        <span className="flex items-center gap-2">
          <SunIcon className="size-3.5 shrink-0" />
          {bed.avgSunlightHours} hrs/day avg. sunlight
        </span>
      )}
      {bed.soilType && (
        <span className="flex items-center gap-2">
          <ShovelIcon className="size-3.5 shrink-0" />
          {bed.soilType}
        </span>
      )}
      {showNotes && bed.notes && (
        <span className="flex items-start gap-2">
          <NotebookPenIcon className="size-3.5 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{bed.notes}</span>
        </span>
      )}
    </div>
  );
}
