import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBedPlacements, createBedPlacement, deleteBedPlacement } from '@/api/beds';
import { gardenGridDimensions, bedPlacementDimensions, formatDimensions } from '@/lib/beds';
import type { BedPlacement, Garden, GardenBed } from '@/types/gardens';
import PlaceBedDialog from '@/components/gardens/PlaceBedDialog';
import PlacementGrid from '@/components/shared/PlacementGrid';
import { LoadingSpinner } from '@/components/ui/query-state';

interface GardenGridProps {
  gardenId: string;
  garden: Garden;
  beds: GardenBed[];
}

export default function GardenGrid({ gardenId, garden, beds }: GardenGridProps) {
  const queryClient = useQueryClient();
  const [placingCell, setPlacingCell] = useState<{ x: number; y: number } | null>(null);

  const { data: placements = [], isLoading: placementsLoading } = useQuery({
    queryKey: ['bed-placements', gardenId],
    queryFn: () => fetchBedPlacements(gardenId),
  });

  const createPlacementMutation = useMutation({
    mutationFn: ({ bedId, x, y }: { bedId: string; x: number; y: number }) => {
      const bed = beds.find((b) => b.id === bedId)!;
      const { width, height } = bedPlacementDimensions(bed);
      return createBedPlacement(gardenId, { bed: bedId, x, y, width, height });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bed-placements', gardenId] });
      setPlacingCell(null);
    },
  });

  const deletePlacementMutation = useMutation({
    mutationFn: (placementId: string) => deleteBedPlacement(gardenId, placementId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bed-placements', gardenId] }),
  });

  const dims = gardenGridDimensions(garden);
  if (!dims) return null;

  if (placementsLoading) return <LoadingSpinner />;

  const { cols, rows } = dims;
  const placementById = new Map<string, BedPlacement>(placements.map((p) => [p.id, p]));
  const bedById = new Map(beds.map((b) => [b.id, b]));
  const unplacedBeds = beds.filter((b) => !placements.some((p) => p.bed === b.id));

  const placementByCell = new Map<string, BedPlacement>();
  placements.forEach((p) => {
    for (let dx = 0; dx < p.width; dx++) {
      for (let dy = 0; dy < p.height; dy++) {
        placementByCell.set(`${p.x + dx},${p.y + dy}`, p);
      }
    }
  });

  const placeableBedIds = new Set(
    placingCell
      ? unplacedBeds
          .filter((bed) => {
            const { width, height } = bedPlacementDimensions(bed);
            if (placingCell.x + width > cols || placingCell.y + height > rows) return false;
            for (let dx = 0; dx < width; dx++) {
              for (let dy = 0; dy < height; dy++) {
                if (placementByCell.has(`${placingCell.x + dx},${placingCell.y + dy}`)) return false;
              }
            }
            return true;
          })
          .map((b) => b.id)
      : [],
  );

  return (
    <>
      <PlacementGrid
        cols={cols}
        rows={rows}
        placements={placements}
        onEmptyCellClick={(x, y) => setPlacingCell({ x, y })}
        onRemove={(placementId) => deletePlacementMutation.mutate(placementId)}
        isRemoving={deletePlacementMutation.isPending}
        renderCell={(placement) => {
          const full = placementById.get(placement.id);
          const bed = full ? bedById.get(full.bed) : undefined;
          return (
            <div className="flex flex-col items-center gap-0.5 w-full pointer-events-none select-none text-center">
              <span className="text-xs font-medium leading-tight break-words w-full">{bed?.name}</span>
              {bed && (
                <span className="text-xs text-muted-foreground leading-tight">{formatDimensions(bed)}</span>
              )}
              {bed && (
                <span className="text-xs text-muted-foreground leading-tight">
                  {bed.plantCount} {bed.plantCount === 1 ? 'plant' : 'plants'}
                </span>
              )}
            </div>
          );
        }}
      />

      <PlaceBedDialog
        open={!!placingCell}
        onOpenChange={(open) => { if (!open) setPlacingCell(null); }}
        cell={placingCell}
        unplacedBeds={unplacedBeds}
        placeableBedIds={placeableBedIds}
        onPlace={(bedId) =>
          createPlacementMutation.mutate({ bedId, x: placingCell!.x, y: placingCell!.y })
        }
        isPlacing={createPlacementMutation.isPending}
      />
    </>
  );
}
