import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPlacements, createPlacement, deletePlacement } from '@/api/plants';
import { bedGridDimensions } from '@/lib/beds';
import type { GardenBed } from '@/types/gardens';
import type { PlantPlacement, UserPlant } from '@/types/plants';
import PlacePlantDialog from '@/components/plants/PlacePlantDialog';
import PlacementGrid from '@/components/ui/PlacementGrid';
import { LoadingSpinner } from '@/components/ui/query-state';

interface BedGridProps {
  gardenId: string;
  bedId: string;
  bed: GardenBed;
  userPlants: UserPlant[];
}

export default function BedGrid({ gardenId, bedId, bed, userPlants }: BedGridProps) {
  const queryClient = useQueryClient();
  const [placingCell, setPlacingCell] = useState<{ x: number; y: number } | null>(null);

  const { data: placements = [], isLoading: placementsLoading } = useQuery({
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

  if (placementsLoading) return <LoadingSpinner />;

  const { cols, rows } = bedGridDimensions(bed);
  const placementById = new Map<string, PlantPlacement>(placements.map((p) => [p.id, p]));
  const userPlantById = new Map(userPlants.map((p) => [p.id, p]));
  const unplacedPlants = userPlants.filter((p) => !placements.some((pl) => pl.userPlant === p.id));

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
          const plant = full ? userPlantById.get(full.userPlant) : undefined;
          return (
            <span className="text-xs leading-tight text-center break-words w-full pointer-events-none select-none">
              {plant?.plantName}
              {plant?.variety && (
                <span className="block text-muted-foreground truncate">{plant.variety}</span>
              )}
            </span>
          );
        }}
      />

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
