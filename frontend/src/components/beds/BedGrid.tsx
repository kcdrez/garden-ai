import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchPlacements, createPlacement, movePlacement, deletePlacement } from '@/api/plants';
import { toFeet } from '@/lib/beds';
import type { GardenBed } from '@/types/gardens';
import type { PlantPlacement, UserPlant } from '@/types/plants';
import PlacePlantDialog from '@/components/plants/PlacePlantDialog';
import PlacementCanvas, { type CanvasItem } from '@/components/shared/PlacementCanvas';
import { LoadingSpinner } from '@/components/ui/query-state';

interface BedGridProps {
  gardenId: string;
  bedId: string;
  bed: GardenBed;
  userPlants: UserPlant[];
}

export default function BedGrid({ gardenId, bedId, bed, userPlants }: BedGridProps) {
  const queryClient = useQueryClient();
  const [placingAt, setPlacingAt] = useState<{ x: number; y: number } | null>(null);

  const { data: placements = [], isLoading } = useQuery({
    queryKey: ['placements', bedId],
    queryFn: () => fetchPlacements(gardenId, bedId),
  });

  const createMutation = useMutation({
    mutationFn: ({ userPlantId, x, y, width, height }: { userPlantId: string; x: number; y: number; width: number; height: number }) =>
      createPlacement(gardenId, bedId, { userPlant: userPlantId, x, y, width, height }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placements', bedId] });
      setPlacingAt(null);
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ placementId, x, y }: { placementId: string; x: number; y: number }) =>
      movePlacement(gardenId, bedId, placementId, x, y),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['placements', bedId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (placementId: string) => deletePlacement(gardenId, bedId, placementId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['placements', bedId] }),
  });

  if (isLoading) return <LoadingSpinner />;

  const widthFt = toFeet(bed.width, bed.unit);
  const heightFt = toFeet(bed.length, bed.unit);

  const userPlantById = new Map<string, UserPlant>(userPlants.map((p) => [p.id, p]));
  const placementById = new Map<string, PlantPlacement>(placements.map((p) => [p.id, p]));
  const unplacedPlants = userPlants.filter((p) => !placements.some((pl) => pl.userPlant === p.id));

  const items: CanvasItem[] = placements.map((p) => ({
    id: p.id,
    x: p.x,
    y: p.y,
    widthFt: p.width,
    heightFt: p.height,
  }));

  return (
    <>
      <PlacementCanvas
        widthFt={widthFt}
        heightFt={heightFt}
        items={items}
        renderItem={(item) => {
          const placement = placementById.get(item.id);
          const plant = placement ? userPlantById.get(placement.userPlant) : undefined;
          const r = Math.min(item.widthFt, item.heightFt) / 2;
          const cx = item.widthFt / 2;
          const cy = item.heightFt / 2;
          const fontSize = Math.max(0.1, r * 0.55);
          return (
            <>
              <circle
                cx={cx} cy={cy} r={r}
                className="fill-primary/20 stroke-primary/50"
                strokeWidth={0.04}
              />
              <text
                x={cx} y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                className="fill-foreground"
                style={{ userSelect: 'none', pointerEvents: 'none' }}
              >
                {plant?.plantName}
              </text>
              {plant?.variety && (
                <text
                  x={cx} y={cy + fontSize * 1.2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fontSize * 0.8}
                  className="fill-muted-foreground"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {plant.variety}
                </text>
              )}
            </>
          );
        }}
        onEmptyClick={(x, y) => setPlacingAt({ x, y })}
        onMove={(placementId, x, y) => moveMutation.mutate({ placementId, x, y })}
        onRemove={(placementId) => deleteMutation.mutate(placementId)}
        isRemoving={deleteMutation.isPending}
      />

      {unplacedPlants.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-2">
            Unplaced plants — click the canvas to place
          </p>
          <div className="flex flex-wrap gap-2">
            {unplacedPlants.map((plant) => (
              <div
                key={plant.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded text-xs"
              >
                <span>{plant.plantName}</span>
                {plant.variety && <span className="text-muted-foreground">{plant.variety}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <PlacePlantDialog
        open={!!placingAt}
        onOpenChange={(open) => { if (!open) setPlacingAt(null); }}
        cell={placingAt}
        unplacedPlants={unplacedPlants}
        onPlace={(userPlantId) => {
          const plant = userPlantById.get(userPlantId);
          const spacing = plant?.plantDefaultSpacingFt ?? 1.0;
          createMutation.mutate({
            userPlantId,
            x: placingAt!.x,
            y: placingAt!.y,
            width: spacing,
            height: spacing,
          });
        }}
        isPlacing={createMutation.isPending}
        gardenId={gardenId}
        bedId={bedId}
      />
    </>
  );
}
