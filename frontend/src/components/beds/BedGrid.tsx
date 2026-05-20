import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { XIcon } from 'lucide-react';
import { fetchPlacements, createPlacement, deletePlacement } from '@/api/plants';
import { bedGridDimensions } from '@/lib/beds';
import type { GardenBed } from '@/types/gardens';
import type { PlantPlacement, UserPlant } from '@/types/plants';
import PlacePlantDialog from '@/components/plants/PlacePlantDialog';

interface BedGridProps {
  gardenId: string;
  bedId: string;
  bed: GardenBed;
  userPlants: UserPlant[];
}

export default function BedGrid({ gardenId, bedId, bed, userPlants }: BedGridProps) {
  const queryClient = useQueryClient();
  const [placingCell, setPlacingCell] = useState<{ x: number; y: number } | null>(null);

  const { data: placements = [] } = useQuery({
    queryKey: ['placements', bedId],
    queryFn: () => fetchPlacements(gardenId, bedId),
  });

  const createPlacementMutation = useMutation({
    mutationFn: ({ userPlant, x, y }: { userPlant: string; x: number; y: number }) =>
      createPlacement(gardenId, bedId, { userPlant, x, y }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placements', bedId] });
      setPlacingCell(null);
    },
  });

  const deletePlacementMutation = useMutation({
    mutationFn: (placementId: string) => deletePlacement(gardenId, bedId, placementId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['placements', bedId] }),
  });

  const { cols, rows } = bedGridDimensions(bed);

  const placementByCell = new Map<string, PlantPlacement>();
  placements.forEach((p) => {
    for (let dx = 0; dx < p.width; dx++) {
      for (let dy = 0; dy < p.height; dy++) {
        placementByCell.set(`${p.x + dx},${p.y + dy}`, p);
      }
    }
  });

  const userPlantById = new Map(userPlants.map((p) => [p.id, p]));
  const unplacedPlants = userPlants.filter((p) => !placements.some((pl) => pl.userPlant === p.id));

  return (
    <>
      <div className="overflow-auto">
        <div
          className="inline-grid gap-px bg-border border border-border rounded p-px"
          style={{ gridTemplateColumns: `repeat(${cols}, 6rem)` }}
        >
          {Array.from({ length: rows * cols }, (_, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const placement = placementByCell.get(`${col},${row}`);
            const isOrigin = placement && placement.x === col && placement.y === row;
            const plant = placement ? userPlantById.get(placement.userPlant) : undefined;

            if (placement && !isOrigin) return null;

            if (placement) {
              return (
                <div
                  key={`${col},${row}`}
                  className="w-24 h-24 bg-primary/15 relative group flex items-center justify-center p-1 overflow-hidden"
                  style={
                    placement.width > 1 || placement.height > 1
                      ? { gridColumn: `span ${placement.width}`, gridRow: `span ${placement.height}` }
                      : undefined
                  }
                >
                  <span className="text-xs leading-tight text-center break-words w-full pointer-events-none select-none">
                    {plant?.plantName}
                    {plant?.variety && (
                      <span className="block text-muted-foreground truncate">{plant.variety}</span>
                    )}
                  </span>
                  <button
                    className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-destructive/80 text-destructive-foreground transition-colors"
                    onClick={() => deletePlacementMutation.mutate(placement.id)}
                    disabled={deletePlacementMutation.isPending}
                    aria-label={`Remove ${plant?.plantName ?? 'plant'} from grid`}
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              );
            }

            return (
              <button
                key={`${col},${row}`}
                className="w-24 h-24 bg-background hover:bg-muted/50 transition-colors"
                onClick={() => setPlacingCell({ x: col, y: row })}
                aria-label={`Place plant at column ${col + 1}, row ${row + 1}`}
              />
            );
          })}
        </div>
      </div>

      <PlacePlantDialog
        open={!!placingCell}
        onOpenChange={(open) => { if (!open) setPlacingCell(null); }}
        cell={placingCell}
        unplacedPlants={unplacedPlants}
        onPlace={(userPlantId) =>
          createPlacementMutation.mutate({ userPlant: userPlantId, x: placingCell!.x, y: placingCell!.y })
        }
        isPlacing={createPlacementMutation.isPending}
      />
    </>
  );
}
