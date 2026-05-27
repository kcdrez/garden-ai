import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { EditIcon, ArrowRightLeftIcon, Trash2Icon } from 'lucide-react';
import { fetchPlacements, createPlacement, movePlacement, deleteUserPlant } from '@/api/plants';
import { toFeet, plantColor } from '@/lib/beds';
import { getErrorMessage } from '@/lib/errors';
import type { GardenBed } from '@/types/gardens';
import type { PlantPlacement, UserPlant } from '@/types/plants';
import PlacePlantDialog from '@/components/plants/PlacePlantDialog';
import UserPlantDialog from '@/components/plants/UserPlantDialog';
import MovePlantDialog from '@/components/plants/MovePlantDialog';
import PlacementCanvas, { type CanvasItem, type CanvasMenuItem } from '@/components/shared/PlacementCanvas';
import { LoadingSpinner } from '@/components/ui/query-state';
import { useConfirm } from '@/hooks/useConfirm';

interface BedGridProps {
  gardenId: string;
  bedId: string;
  bed: GardenBed;
  userPlants: UserPlant[];
}

export default function BedGrid({ gardenId, bedId, bed, userPlants }: BedGridProps) {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [placingAt, setPlacingAt] = useState<{ x: number; y: number } | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [editingPlant, setEditingPlant] = useState<UserPlant | null>(null);
  const [movingPlant, setMovingPlant] = useState<UserPlant | null>(null);

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
    onMutate: async ({ placementId, x, y }) => {
      await queryClient.cancelQueries({ queryKey: ['placements', bedId] });
      const previous = queryClient.getQueryData<PlantPlacement[]>(['placements', bedId]);
      queryClient.setQueryData<PlantPlacement[]>(['placements', bedId], (old = []) =>
        old.map((p) => (p.id === placementId ? { ...p, x, y } : p)),
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['placements', bedId], context.previous);
      }
      setMutationError(getErrorMessage(err));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['placements', bedId] }),
  });

  const deleteUserPlantMutation = useMutation({
    mutationFn: ({ plantId }: { plantId: string }) =>
      deleteUserPlant(gardenId, bedId, plantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['placements', bedId] });
      queryClient.invalidateQueries({ queryKey: ['plants', 'user'] });
      setMutationError(null);
    },
    onError: (err) => setMutationError(getErrorMessage(err)),
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

  function getMenuItems(placementId: string): CanvasMenuItem[] {
    const placement = placementById.get(placementId);
    const plant = placement ? userPlantById.get(placement.userPlant) : undefined;

    return [
      {
        label: 'Edit',
        icon: <EditIcon className="size-4" />,
        onClick: () => { if (plant) setEditingPlant(plant); },
      },
      {
        label: 'Move',
        icon: <ArrowRightLeftIcon className="size-4" />,
        onClick: () => { if (plant) setMovingPlant(plant); },
      },
      {
        label: 'Delete',
        icon: <Trash2Icon className="size-4" />,
        variant: 'destructive' as const,
        onClick: async () => {
          if (!plant) return;
          const ok = await confirm({
            title: 'Delete plant?',
            description: `"${plant.plantName}${plant.variety ? ` — ${plant.variety}` : ''}" will be permanently deleted from this bed.`,
          });
          if (ok) deleteUserPlantMutation.mutate({ plantId: plant.id });
        },
      },
    ];
  }

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
          const fontSize = Math.max(0.08, Math.min(r * 0.3, 0.2));
          const color = plantColor(plant?.plant ?? '', plant?.variety ?? '');
          return (
            <>
              <circle
                cx={cx} cy={cy} r={r}
                fill={color.fill}
                stroke={color.stroke}
                strokeWidth={0.04}
              />
              <text
                x={cx} y={cy}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fill="#1e293b"
                style={{ userSelect: 'none', pointerEvents: 'none', letterSpacing: 0 }}
              >
                {plant?.plantName}
              </text>
              {plant?.variety && (
                <text
                  x={cx} y={cy + fontSize * 1.2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fontSize * 0.8}
                  fill="#475569"
                  style={{ userSelect: 'none', pointerEvents: 'none', letterSpacing: 0 }}
                >
                  {plant.variety.split(' ')[0]}
                </text>
              )}
            </>
          );
        }}
        onEmptyClick={(x, y) => setPlacingAt({ x, y })}
        onMove={(placementId, x, y) => moveMutation.mutate({ placementId, x, y })}
        getMenuItems={getMenuItems}
      />

      {mutationError && (
        <p className="mt-2 text-sm text-destructive">{mutationError}</p>
      )}

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
        onOpenChange={(open) => {
          if (!open) {
            setPlacingAt(null);
            createMutation.reset();
          }
        }}
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
        placeError={createMutation.isError ? getErrorMessage(createMutation.error) : null}
        gardenId={gardenId}
        bedId={bedId}
      />

      {editingPlant && (
        <UserPlantDialog
          gardenId={gardenId}
          bedId={bedId}
          userPlant={editingPlant}
          open
          onOpenChange={(open) => { if (!open) setEditingPlant(null); }}
        />
      )}
      {movingPlant && (
        <MovePlantDialog
          userPlant={movingPlant}
          open
          onOpenChange={(open) => { if (!open) setMovingPlant(null); }}
        />
      )}
    </>
  );
}
