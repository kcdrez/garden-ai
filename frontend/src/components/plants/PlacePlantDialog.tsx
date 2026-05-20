import { LeafIcon } from 'lucide-react';
import type { UserPlant } from '@/types/plants';
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
  unplacedPlants: UserPlant[];
  onPlace: (userPlantId: string) => void;
  isPlacing: boolean;
};

export default function PlacePlantDialog({
  open,
  onOpenChange,
  cell,
  unplacedPlants,
  onPlace,
  isPlacing,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Place plant — column {(cell?.x ?? 0) + 1}, row {(cell?.y ?? 0) + 1}
          </DialogTitle>
        </DialogHeader>

        {unplacedPlants.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            All plants in this bed are already placed on the grid.
          </p>
        ) : (
          <ul className="flex flex-col gap-1 py-1">
            {unplacedPlants.map((plant) => (
              <li key={plant.id}>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 h-auto py-2"
                  disabled={isPlacing}
                  onClick={() => onPlace(plant.id)}
                >
                  <LeafIcon className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-sm">
                    {plant.plantName}
                    {plant.variety && (
                      <span className="text-muted-foreground"> — {plant.variety}</span>
                    )}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
