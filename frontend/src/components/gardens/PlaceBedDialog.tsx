import { LayoutDashboardIcon } from 'lucide-react';
import type { GardenBed } from '@/types/gardens';
import { formatDimensions } from '@/lib/beds';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: { x: number; y: number } | null;
  unplacedBeds: GardenBed[];
  placeableBedIds: Set<string>;
  onPlace: (bedId: string) => void;
  isPlacing: boolean;
};

export default function PlaceBedDialog({
  open,
  onOpenChange,
  cell,
  unplacedBeds,
  placeableBedIds,
  onPlace,
  isPlacing,
}: Props) {
  const available = unplacedBeds.filter((b) => placeableBedIds.has(b.id));
  const tooLarge = unplacedBeds.filter((b) => !placeableBedIds.has(b.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Place Bed — Column {(cell?.x ?? 0) + 1}, Row {(cell?.y ?? 0) + 1}
          </DialogTitle>
        </DialogHeader>

        {unplacedBeds.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            All beds in this garden are already placed on the grid.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {available.length > 0 && (
              <section>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Select a bed
                </p>
                <ul className="flex flex-col gap-1 py-2">
                  {available.map((bed) => (
                    <li key={bed.id}>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 h-auto py-2"
                        disabled={isPlacing}
                        onClick={() => onPlace(bed.id)}
                      >
                        <LayoutDashboardIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm">{bed.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{formatDimensions(bed)}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {tooLarge.length > 0 && (
              <section>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Won't fit here
                </p>
                <ul className="flex flex-col gap-1 py-2">
                  {tooLarge.map((bed) => (
                    <li key={bed.id}>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2 h-auto py-2"
                        disabled
                      >
                        <LayoutDashboardIcon className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="text-sm">{bed.name}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{formatDimensions(bed)}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
                {available.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2">
                    Try clicking a cell with more room.
                  </p>
                )}
              </section>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
