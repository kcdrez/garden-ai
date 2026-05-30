import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CopyIcon, EditIcon, ArrowRightLeftIcon, ArrowUpRightIcon, ClipboardListIcon, MinusCircleIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { usePlantPlacementActions } from '@/hooks/usePlantPlacementActions';
import { routes } from '@/lib/routes';
import { toFeet } from '@/lib/beds';
import { plantEmoji, plantImage } from '@/lib/plants';
import { getErrorMessage } from '@/lib/errors';
import type { GardenBed } from '@/types/gardens';
import type { UserPlant } from '@/types/plants';
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
  const confirm = useConfirm();
  const [placingAt, setPlacingAt] = useState<{ x: number; y: number } | null>(null);
  const [editingPlant, setEditingPlant] = useState<UserPlant | null>(null);
  const [movingPlant, setMovingPlant] = useState<UserPlant | null>(null);
  const [observingPlant, setObservingPlant] = useState<UserPlant | null>(null);
  const [addPlantOpen, setAddPlantOpen] = useState(false);

  const {
    placements,
    isLoading,
    mutationError,
    createPlacement,
    movePlacement,
    resizePlacement,
    removePlacement,
    clonePlant,
    deletePlant,
    isCreating,
    createFailed,
    createError,
    resetCreate,
    isDeleting,
  } = usePlantPlacementActions(gardenId, bedId);

  if (isLoading) return <LoadingSpinner />;

  const widthFt = toFeet(bed.width, bed.unit);
  const heightFt = toFeet(bed.length, bed.unit);

  const userPlantById = new Map<string, UserPlant>(userPlants.map((p) => [p.id, p]));
  const placementById = new Map(placements.map((p) => [p.id, p]));
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
        onClick: () => removePlacement(placementId),
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
            clonePlant({ plantId: plant.id, placement: { x: p.x + p.width, y: p.y, width: p.width, height: p.height } });
          } else {
            clonePlant({ plantId: plant.id });
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
          if (ok) deletePlant(plant.id);
        },
      },
    ];
  }

  async function handleUnplacedDelete(plant: UserPlant) {
    const ok = await confirm({
      title: 'Delete plant?',
      description: `"${plant.plantName}${plant.variety ? ` — ${plant.variety}` : ''}" will be permanently deleted from this bed.`,
    });
    if (ok) deletePlant(plant.id);
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
        onMove={(placementId, x, y) => movePlacement({ placementId, x, y })}
        onResize={(placementId, widthFt, heightFt) => resizePlacement({ placementId, widthFt, heightFt })}
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
                  onClone={() => clonePlant({ plantId: plant.id })}
                  onMove={() => setMovingPlant(plant)}
                  onDelete={() => handleUnplacedDelete(plant)}
                  isDeleting={isDeleting}
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
            resetCreate();
          }
        }}
        cell={placingAt}
        unplacedPlants={unplacedPlants}
        onPlace={(userPlantId) => {
          const plant = userPlantById.get(userPlantId);
          const spacing = plant?.plantDefaultSpacingFt ?? 1.0;
          createPlacement(
            { userPlantId, x: placingAt!.x, y: placingAt!.y, width: spacing, height: spacing },
            () => setPlacingAt(null),
          );
        }}
        isPlacing={isCreating}
        placeError={createFailed ? getErrorMessage(createError) : null}
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
