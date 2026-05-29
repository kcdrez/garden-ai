import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CopyIcon, EditIcon, ArrowRightLeftIcon, ArrowUpRightIcon, ClipboardListIcon, MinusCircleIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { fetchPlacements, createPlacement, movePlacement, resizePlacement, deletePlacement, cloneUserPlant, deleteUserPlant } from '@/api/plants';
import { routes } from '@/lib/routes';
import { toFeet } from '@/lib/beds';
import { plantEmoji, plantImage } from '@/lib/plants';
import { getErrorMessage } from '@/lib/errors';
import type { GardenBed } from '@/types/gardens';
import type { PlantPlacement, UserPlant } from '@/types/plants';
import PlacePlantDialog from '@/components/plants/PlacePlantDialog';
import UserPlantDialog from '@/components/plants/UserPlantDialog';
import MovePlantDialog from '@/components/plants/MovePlantDialog';
import PlantObservationsSheet from '@/components/plants/PlantObservationsSheet';
import CardActionsMenu from '@/components/ui/card-actions-menu';
import PlacementCanvas from '@/components/shared/PlacementCanvas';
import type { CanvasItem, CanvasMenuItem } from '@/types/canvas';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/query-state';
import { useConfirm } from '@/hooks/useConfirm';

interface BedGridProps {
  gardenId: string;
  bedId: string;
  bed: GardenBed;
  userPlants: UserPlant[];
}

export default function BedGrid({ gardenId, bedId, bed, userPlants }: BedGridProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [placingAt, setPlacingAt] = useState<{ x: number; y: number } | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [editingPlant, setEditingPlant] = useState<UserPlant | null>(null);
  const [movingPlant, setMovingPlant] = useState<UserPlant | null>(null);
  const [observingPlant, setObservingPlant] = useState<UserPlant | null>(null);
  const [addPlantOpen, setAddPlantOpen] = useState(false);

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

  const cloneUserPlantMutation = useMutation({
    mutationFn: ({ plantId, placement }: {
      plantId: string;
      placement?: { x: number; y: number; width: number; height: number };
    }) => cloneUserPlant(gardenId, bedId, plantId, placement),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plants', 'user', bedId] });
      queryClient.invalidateQueries({ queryKey: ['plants', 'user'] });
      queryClient.invalidateQueries({ queryKey: ['placements', bedId] });
    },
    onError: (err) => setMutationError(getErrorMessage(err)),
  });

  const resizeMutation = useMutation({
    mutationFn: ({ placementId, widthFt, heightFt }: { placementId: string; widthFt: number; heightFt: number }) =>
      resizePlacement(gardenId, bedId, placementId, widthFt, heightFt),
    onMutate: async ({ placementId, widthFt, heightFt }) => {
      await queryClient.cancelQueries({ queryKey: ['placements', bedId] });
      const previous = queryClient.getQueryData<PlantPlacement[]>(['placements', bedId]);
      queryClient.setQueryData<PlantPlacement[]>(['placements', bedId], (old = []) =>
        old.map((p) => (p.id === placementId ? { ...p, width: widthFt, height: heightFt } : p)),
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

  const removePlacementMutation = useMutation({
    mutationFn: ({ placementId }: { placementId: string }) =>
      deletePlacement(gardenId, bedId, placementId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['placements', bedId] }),
    onError: (err) => setMutationError(getErrorMessage(err)),
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
        label: 'Remove from Bed',
        icon: <MinusCircleIcon className="size-4" />,
        onClick: () => removePlacementMutation.mutate({ placementId }),
      },
      {
        label: 'View Details',
        icon: <ArrowUpRightIcon className="size-4" />,
        onClick: () => { if (plant) navigate(routes.plantDetail(plant.id)); },
      },
      {
        label: 'Observations',
        icon: <ClipboardListIcon className="size-4" />,
        onClick: () => { if (plant) setObservingPlant(plant); },
      },
      {
        label: 'Edit',
        icon: <EditIcon className="size-4" />,
        onClick: () => { if (plant) setEditingPlant(plant); },
      },
      {
        label: 'Clone',
        icon: <CopyIcon className="size-4" />,
        onClick: () => {
          if (!plant) return;
          const p = placementById.get(placementId);
          if (p) {
            cloneUserPlantMutation.mutate({ plantId: plant.id, placement: { x: p.x + p.width, y: p.y, width: p.width, height: p.height } });
          } else {
            cloneUserPlantMutation.mutate({ plantId: plant.id });
          }
        },
      },
      {
        label: 'Move to Another Bed',
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

  async function handleUnplacedDelete(plant: UserPlant) {
    const ok = await confirm({
      title: 'Delete plant?',
      description: `"${plant.plantName}${plant.variety ? ` — ${plant.variety}` : ''}" will be permanently deleted from this bed.`,
    });
    if (ok) deleteUserPlantMutation.mutate({ plantId: plant.id });
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
          const rx = item.widthFt / 2;
          const ry = item.heightFt / 2;
          const cx = rx;
          const cy = ry;
          const imgSrc = plant ? plantImage(plant.plantName) : null;
          const emoji = plant ? plantEmoji(plant.plantName, plant.plantCategory) : '🌱';
          const emojiFontSize = Math.min(rx, ry) * 1.6;
          const imgSize = Math.min(item.widthFt, item.heightFt) * 0.85;
          return (
            <>
              <ellipse
                cx={cx} cy={cy} rx={rx} ry={ry}
                fill="rgba(128,128,128,0.12)"
                stroke="rgba(128,128,128,0.3)"
                strokeWidth={0.04}
              />
              {imgSrc ? (
                <image
                  href={imgSrc}
                  x={cx - imgSize / 2}
                  y={cy - imgSize / 2}
                  width={imgSize}
                  height={imgSize}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ pointerEvents: 'none' }}
                />
              ) : (
                <text
                  x={cx} y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={emojiFontSize}
                  style={{ userSelect: 'none', pointerEvents: 'none', letterSpacing: 0 }}
                >
                  {emoji}
                </text>
              )}
            </>
          );
        }}
        onEmptyClick={(x, y) => setPlacingAt({ x, y })}
        onMove={(placementId, x, y) => moveMutation.mutate({ placementId, x, y })}
        onResize={(placementId, widthFt, heightFt) => resizeMutation.mutate({ placementId, widthFt, heightFt })}
        getMenuItems={getMenuItems}
      />

      {mutationError && (
        <p className="mt-2 text-sm text-destructive">{mutationError}</p>
      )}

      <div className="mt-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2>Unplaced Plants</h2>
            {unplacedPlants.length > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">Click the bed layout to place</p>
            )}
          </div>
          <Button size="sm" onClick={() => setAddPlantOpen(true)}>
            <PlusIcon className="size-4" />
            Create Plant
          </Button>
        </div>
        {unplacedPlants.length === 0 ? (
          <p className="text-sm text-muted-foreground">All plants are placed in the bed.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unplacedPlants.map((plant) => (
              <div
                key={plant.id}
                className="flex items-center gap-1 pl-3 pr-1 py-1 bg-primary/10 border border-primary/20 rounded text-xs"
              >
                <span className="font-medium">{plant.plantName}</span>
                {plant.variety && <span className="text-muted-foreground">{plant.variety}</span>}
                <CardActionsMenu
                  label={`${plant.plantName} actions`}
                  onEdit={() => setEditingPlant(plant)}
                  onClone={() => cloneUserPlantMutation.mutate({ plantId: plant.id })}
                  onMove={() => setMovingPlant(plant)}
                  onDelete={() => handleUnplacedDelete(plant)}
                  isDeleting={deleteUserPlantMutation.isPending}
                />
              </div>
            ))}
          </div>
        )}
      </div>


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

      <UserPlantDialog
        gardenId={gardenId}
        bedId={bedId}
        open={addPlantOpen || !!editingPlant}
        userPlant={editingPlant ?? undefined}
        onOpenChange={(open) => {
          if (!open) {
            setAddPlantOpen(false);
            setEditingPlant(null);
          }
        }}
      />

      {movingPlant && (
        <MovePlantDialog
          userPlant={movingPlant}
          open
          onOpenChange={(open) => { if (!open) setMovingPlant(null); }}
        />
      )}

      {observingPlant && (
        <PlantObservationsSheet
          plant={observingPlant}
          gardenId={gardenId}
          bedId={bedId}
          open
          onOpenChange={(open) => { if (!open) setObservingPlant(null); }}
        />
      )}
    </>
  );
}
