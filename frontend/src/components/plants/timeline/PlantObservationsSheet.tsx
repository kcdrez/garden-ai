import type { UserPlant } from '@/types/plants';
import PlantTimeline from '@/components/plants/timeline/PlantTimeline';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type Props = {
  plant: UserPlant;
  gardenId: string;
  bedId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function PlantObservationsSheet({ plant, gardenId, bedId, open, onOpenChange }: Props) {
  const title = plant.variety ? `${plant.plantName} — ${plant.variety}` : plant.plantName;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto flex-1 px-1">
          <PlantTimeline gardenId={gardenId} bedId={bedId} plant={plant} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
