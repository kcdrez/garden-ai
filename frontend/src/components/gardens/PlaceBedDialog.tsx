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
  onPlace: (bedId: string) => void;
  isPlacing: boolean;
  placeError?: string | null;
};

export default function PlaceBedDialog({
  open,
  onOpenChange,
  unplacedBeds,
  onPlace,
  isPlacing,
  placeError = null,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place a Bed</DialogTitle>
        </DialogHeader>

        {placeError && (
          <p className="text-sm text-destructive">{placeError}</p>
        )}

        {unplacedBeds.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            All beds in this garden are already placed on the canvas.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 py-2">
            {unplacedBeds.map((bed) => (
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
        )}
      </DialogContent>
    </Dialog>
  );
}
