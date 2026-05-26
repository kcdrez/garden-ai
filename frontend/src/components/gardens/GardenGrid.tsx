import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, DragOverlay, type DragEndEvent } from '@dnd-kit/core';
import { fetchBedPlacements, createBedPlacement, deleteBedPlacement } from '@/api/beds';
import { gardenGridDimensions, bedPlacementDimensions, formatDimensions } from '@/lib/beds';
import type { BedPlacement, Garden, GardenBed } from '@/types/gardens';
import PlaceBedDialog from '@/components/gardens/PlaceBedDialog';
import PlacementGrid, { DraggableChip } from '@/components/shared/PlacementGrid';
import { LoadingSpinner } from '@/components/ui/query-state';

interface GardenGridProps {
  gardenId: string;
  garden: Garden;
  beds: GardenBed[];
}

export default function GardenGrid({ gardenId, garden, beds }: GardenGridProps) {
  const queryClient = useQueryClient();
  const [placingCell, setPlacingCell] = useState<{ x: number; y: number } | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overCellId, setOverCellId] = useState<string | null>(null);

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

  function canPlaceBedAt(bed: GardenBed, x: number, y: number, excludePlacementId?: string) {
    const { width, height } = bedPlacementDimensions(bed);
    if (x + width > cols || y + height > rows) return false;
    for (let dx = 0; dx < width; dx++) {
      for (let dy = 0; dy < height; dy++) {
        const occupant = placementByCell.get(`${x + dx},${y + dy}`);
        if (occupant && occupant.id !== excludePlacementId) return false;
      }
    }
    return true;
  }

  const activePlacementId = activeDragId?.startsWith('placed:') ? activeDragId.slice(7) : null;
  const visiblePlacements = activePlacementId
    ? placements.filter((p) => p.id !== activePlacementId)
    : placements;

  function getDropState(x: number, y: number): 'valid' | 'invalid' | null {
    if (!activeDragId || !overCellId?.startsWith('cell:')) return null;
    const [overX, overY] = overCellId.slice(5).split(',').map(Number);

    let bedId: string | undefined;
    let excludePlacementId: string | undefined;
    if (activeDragId.startsWith('unplaced:')) {
      bedId = activeDragId.slice(9);
    } else if (activeDragId.startsWith('placed:')) {
      const existing = placementById.get(activeDragId.slice(7));
      bedId = existing?.bed;
      excludePlacementId = activeDragId.slice(7);
    }
    if (!bedId) return null;
    const bed = bedById.get(bedId);
    if (!bed) return null;

    const { width, height } = bedPlacementDimensions(bed);
    if (x >= overX && x < overX + width && y >= overY && y < overY + height) {
      return canPlaceBedAt(bed, overX, overY, excludePlacementId) ? 'valid' : 'invalid';
    }
    return null;
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    setOverCellId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (!overId.startsWith('cell:')) return;
    const [x, y] = overId.slice(5).split(',').map(Number);

    if (activeId.startsWith('unplaced:')) {
      const bedId = activeId.slice(9);
      const bed = bedById.get(bedId);
      if (!bed || !canPlaceBedAt(bed, x, y)) return;
      createPlacementMutation.mutate({ bedId, x, y });
    } else if (activeId.startsWith('placed:')) {
      const placementId = activeId.slice(7);
      const existing = placementById.get(placementId);
      if (!existing || (existing.x === x && existing.y === y)) return;
      const bed = bedById.get(existing.bed);
      if (!bed || !canPlaceBedAt(bed, x, y, placementId)) return;
      deletePlacementMutation.mutate(placementId, {
        onSuccess: () =>
          createPlacementMutation.mutate(
            { bedId: existing.bed, x, y },
            {
              onError: () =>
                queryClient.invalidateQueries({ queryKey: ['bed-placements', gardenId] }),
            },
          ),
      });
    }
  }

  function renderDragOverlay() {
    if (!activeDragId) return null;
    let bedName: string | undefined;
    if (activeDragId.startsWith('unplaced:')) {
      bedName = bedById.get(activeDragId.slice(9))?.name;
    } else if (activeDragId.startsWith('placed:')) {
      const placement = placementById.get(activeDragId.slice(7));
      bedName = placement ? bedById.get(placement.bed)?.name : undefined;
    }
    if (!bedName) return null;
    return (
      <div className="px-2 py-1 bg-popover border rounded text-xs shadow-md cursor-grabbing select-none">
        {bedName}
      </div>
    );
  }

  return (
    <DndContext
      onDragStart={({ active }) => setActiveDragId(String(active.id))}
      onDragOver={({ over }) => setOverCellId(over ? String(over.id) : null)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => { setActiveDragId(null); setOverCellId(null); }}
    >
      <>
        <PlacementGrid
          cols={cols}
          rows={rows}
          placements={visiblePlacements}
          onEmptyCellClick={(x, y) => setPlacingCell({ x, y })}
          getDropState={activeDragId ? getDropState : undefined}
          onRemove={(placementId) =>
        deletePlacementMutation.mutate(placementId, {
          onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ['bed-placements', gardenId] }),
        })
      }
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

        {unplacedBeds.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2">
              Unplaced beds — drag to grid or click a cell
            </p>
            <div className="flex flex-wrap gap-2">
              {unplacedBeds.map((bed) => (
                <DraggableChip key={bed.id} dragId={`unplaced:${bed.id}`}>
                  <div className="flex flex-col">
                    <span>{bed.name}</span>
                    <span className="text-muted-foreground">{formatDimensions(bed)}</span>
                  </div>
                </DraggableChip>
              ))}
            </div>
          </div>
        )}

        <DragOverlay dropAnimation={null}>{renderDragOverlay()}</DragOverlay>

        <PlaceBedDialog
          open={!!placingCell}
          onOpenChange={(open) => {
            if (!open) setPlacingCell(null);
          }}
          cell={placingCell}
          unplacedBeds={unplacedBeds}
          placeableBedIds={placeableBedIds}
          onPlace={(bedId) =>
            createPlacementMutation.mutate({ bedId, x: placingCell!.x, y: placingCell!.y })
          }
          isPlacing={createPlacementMutation.isPending}
        />
      </>
    </DndContext>
  );
}
