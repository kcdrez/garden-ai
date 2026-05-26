import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragOverlay, type DragEndEvent } from '@dnd-kit/core';
import { fetchPlacements, createPlacement, deletePlacement } from '@/api/plants';
import { bedGridDimensions } from '@/lib/beds';
import type { GardenBed } from '@/types/gardens';
import type { PlantPlacement, UserPlant } from '@/types/plants';
import PlacePlantDialog from '@/components/plants/PlacePlantDialog';
import PlacementGrid, { DraggableChip } from '@/components/shared/PlacementGrid';
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
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

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
  });

  if (placementsLoading) return <LoadingSpinner />;

  const { cols, rows } = bedGridDimensions(bed);
  const placementById = new Map<string, PlantPlacement>(placements.map((p) => [p.id, p]));
  const userPlantById = new Map(userPlants.map((p) => [p.id, p]));
  const unplacedPlants = userPlants.filter((p) => !placements.some((pl) => pl.userPlant === p.id));

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (!overId.startsWith('cell:')) return;
    const [x, y] = overId.slice(5).split(',').map(Number);

    if (activeId.startsWith('unplaced:')) {
      createPlacementMutation.mutate({ userPlant: activeId.slice(9), x, y });
    } else if (activeId.startsWith('placed:')) {
      const placementId = activeId.slice(7);
      const existing = placements.find((p) => p.id === placementId);
      if (!existing || (existing.x === x && existing.y === y)) return;
      deletePlacementMutation.mutate(placementId, {
        onSuccess: () =>
          createPlacementMutation.mutate(
            { userPlant: existing.userPlant, x, y },
            { onError: () => queryClient.invalidateQueries({ queryKey: ['placements', bedId] }) },
          ),
      });
    }
  }

  function renderDragOverlay() {
    if (!activeDragId) return null;

    if (activeDragId.startsWith('unplaced:')) {
      const plant = userPlantById.get(activeDragId.slice(9));
      if (!plant) return null;
      return (
        <div className="flex flex-col px-3 py-1.5 bg-primary/10 border border-primary/20 rounded text-xs shadow-lg cursor-grabbing">
          <span>{plant.plantName}</span>
          {plant.variety && <span className="text-muted-foreground">{plant.variety}</span>}
        </div>
      );
    }

    if (activeDragId.startsWith('placed:')) {
      const placement = placements.find((p) => p.id === activeDragId.slice(7));
      if (!placement) return null;
      const plant = userPlantById.get(placement.userPlant);
      return (
        <div className="w-24 h-24 bg-primary/15 border border-primary/30 rounded flex items-center justify-center p-1 shadow-lg cursor-grabbing">
          <span className="text-xs leading-tight text-center break-words w-full">
            {plant?.plantName}
            {plant?.variety && (
              <span className="block text-muted-foreground truncate">{plant.variety}</span>
            )}
          </span>
        </div>
      );
    }

    return null;
  }

  return (
    <DndContext
      onDragStart={({ active }) => setActiveDragId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDragId(null)}
    >
      <>
        <PlacementGrid
          cols={cols}
          rows={rows}
          placements={placements}
          onEmptyCellClick={(x, y) => setPlacingCell({ x, y })}
          onRemove={(placementId) =>
        deletePlacementMutation.mutate(placementId, {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: ['placements', bedId] }),
        })
      }
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

        {unplacedPlants.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">
              Unplaced plants — drag to grid or click a cell
            </p>
            <div className="flex flex-wrap gap-2">
              {unplacedPlants.map((plant) => (
                <DraggableChip key={plant.id} dragId={`unplaced:${plant.id}`}>
                  <span>{plant.plantName}</span>
                  {plant.variety && (
                    <span className="text-muted-foreground">{plant.variety}</span>
                  )}
                </DraggableChip>
              ))}
            </div>
          </div>
        )}

        <DragOverlay dropAnimation={null}>{renderDragOverlay()}</DragOverlay>

        <PlacePlantDialog
          open={!!placingCell}
          onOpenChange={(open) => {
            if (!open) setPlacingCell(null);
          }}
          cell={placingCell}
          unplacedPlants={unplacedPlants}
          onPlace={(userPlantId) =>
            createPlacementMutation.mutate({ userPlant: userPlantId, x: placingCell!.x, y: placingCell!.y })
          }
          isPlacing={createPlacementMutation.isPending}
        />
      </>
    </DndContext>
  );
}
