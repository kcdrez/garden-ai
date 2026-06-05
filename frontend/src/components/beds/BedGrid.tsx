import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CopyIcon, EditIcon, ArrowRightLeftIcon, ArrowUpRightIcon, ClipboardListIcon, MinusCircleIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { usePlantPlacementActions } from '@/hooks/usePlantPlacementActions';
import { fetchCompanionHints } from '@/api/plants';
import { routes } from '@/lib/routes';
import { toFeet } from '@/lib/beds';
import { plantEmoji, plantImage } from '@/lib/plants';
import { getErrorMessage } from '@/lib/errors';
import type { GardenBed } from '@/types/gardens';
import type { UserPlant } from '@/types/plants';
import PlacePlantDialog from '@/components/plants/PlacePlantDialog';
import UserPlantDialog from '@/components/plants/UserPlantDialog';
import PlantEditForm from '@/components/plants/PlantEditForm';
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
  const [editingPlantId, setEditingPlantId] = useState<string | null>(null);
  const [movingPlantId, setMovingPlantId] = useState<string | null>(null);
  const [observingPlantId, setObservingPlantId] = useState<string | null>(null);
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

  const { data: companionHints = [] } = useQuery({
    queryKey: ['companion-hints', bedId],
    queryFn: () => fetchCompanionHints(gardenId, bedId),
  });

  if (isLoading) return <LoadingSpinner />;

  const widthFt = toFeet(bed.width, bed.unit);
  const heightFt = toFeet(bed.length, bed.unit);
  const areaSqFt = widthFt * heightFt;
  const smartDefaultZoom = areaSqFt <= 6 ? 0.25 : areaSqFt <= 20 ? 0.5 : 1;

  const userPlantById = new Map<string, UserPlant>(userPlants.map((p) => [p.id, p]));
  const placementById = new Map(placements.map((p) => [p.id, p]));
  const unplacedPlants = userPlants.filter((p) => !placements.some((pl) => pl.userPlant === p.id));

  // Map catalog plant ID → companion status for plants currently in this bed
  const companionStatusByCatalogId = new Map<string, { hasBeneficial: boolean; hasHarmful: boolean }>();
  for (const hint of companionHints) {
    for (const catalogId of [hint.plantAId, hint.plantBId]) {
      const existing = companionStatusByCatalogId.get(catalogId) ?? { hasBeneficial: false, hasHarmful: false };
      if (hint.relationship === 'beneficial') existing.hasBeneficial = true;
      if (hint.relationship === 'harmful') existing.hasHarmful = true;
      companionStatusByCatalogId.set(catalogId, existing);
    }
  }

  // Derive live plant references from the current userPlants list so that
  // any re-render triggered by a mutation (e.g. status change) propagates
  // into open sheets/dialogs without needing to reopen them.
  const editingPlant = editingPlantId ? (userPlantById.get(editingPlantId) ?? null) : null;
  const movingPlant = movingPlantId ? (userPlantById.get(movingPlantId) ?? null) : null;
  const observingPlant = observingPlantId ? (userPlantById.get(observingPlantId) ?? null) : null;

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
        label: 'Remove From Layout',
        icon: <MinusCircleIcon className="size-4" />,
        shortcut: 'r',
        onClick: () => removePlacement(placementId),
      },
      {
        label: 'View Details',
        icon: <ArrowUpRightIcon className="size-4" />,
        shortcut: 'v',
        onClick: () => { if (plant) navigate(routes.plantDetail(plant.id)); },
      },
      {
        label: 'Observations',
        icon: <ClipboardListIcon className="size-4" />,
        shortcut: 'o',
        onClick: () => { if (plant) setObservingPlantId(plant.id); },
      },
      {
        label: 'Edit',
        icon: <EditIcon className="size-4" />,
        shortcut: 'e',
        onClick: () => { if (plant) setEditingPlantId(plant.id); },
        primary: true,
      },
      {
        label: 'Duplicate',
        icon: <CopyIcon className="size-4" />,
        shortcut: 'd',
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
        shortcut: 'm',
        onClick: () => { if (plant) setMovingPlantId(plant.id); },
      },
      {
        label: 'Delete',
        icon: <Trash2Icon className="size-4" />,
        variant: 'destructive' as const,
        primary: true,
        shortcut: 'Del',
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

  async function handleDeleteItems(placementIds: string[]) {
    const plantIds = placementIds
      .map(pid => placementById.get(pid)?.userPlant)
      .filter((id): id is string => Boolean(id));
    if (plantIds.length === 0) return;
    const ok = await confirm({
      title: `Delete ${plantIds.length} plant${plantIds.length > 1 ? 's' : ''}?`,
      description: 'The selected plants will be permanently deleted.',
    });
    if (!ok) return;
    for (const id of plantIds) deletePlant(id);
  }

  return (
    <>
      <PlacementCanvas
        widthFt={widthFt}
        heightFt={heightFt}
        items={items}
        onDeleteItems={handleDeleteItems}
        renderItem={(item) => {
          const placement = placementById.get(item.id);
          const plant = placement ? userPlantById.get(placement.userPlant) : undefined;
          const rx = item.widthFt / 2;
          const ry = item.heightFt / 2;
          const cx = rx;
          const cy = ry;
          const imgSrc = plant ? plantImage(plant.plantName) : null;
          const emoji = plant ? plantEmoji(plant.plantName, plant.plantCategory) : '🌱';

          const canvasLabel = plant?.variety ?? '';
          // Shift icon upward only when a variety label is present
          const iconCy = canvasLabel ? cy - ry * 0.2 : cy;
          const emojiFontSize = Math.min(rx, ry) * 1.3;
          const imgSize = Math.min(item.widthFt, item.heightFt) * 0.65;
          const labelFontSize = Math.min(item.widthFt, item.heightFt) * 0.15;
          const truncatedLabel = canvasLabel.length > 10 ? canvasLabel.slice(0, 9) + '…' : canvasLabel;

          const companionStatus = plant ? companionStatusByCatalogId.get(plant.plant) : undefined;
          const hasBoth = companionStatus?.hasBeneficial && companionStatus?.hasHarmful;
          const companionStroke = companionStatus?.hasBeneficial && !hasBoth
            ? 'rgba(34,197,94,0.85)'
            : companionStatus?.hasHarmful && !hasBoth
              ? 'rgba(239,68,68,0.85)'
              : hasBoth
                ? `url(#companion-gradient-${item.id})`
                : 'rgba(128,128,128,0.3)';

          return (
            <>
              {hasBoth && (
                <defs>
                  <linearGradient id={`companion-gradient-${item.id}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(34,197,94,0.85)" />
                    <stop offset="100%" stopColor="rgba(239,68,68,0.85)" />
                  </linearGradient>
                </defs>
              )}
              <ellipse
                cx={cx} cy={cy} rx={rx} ry={ry}
                fill="rgba(128,128,128,0.12)"
                stroke={companionStroke}
                strokeWidth={0.04}
              />
              {imgSrc ? (
                <image
                  href={imgSrc}
                  x={cx - imgSize / 2}
                  y={iconCy - imgSize / 2}
                  width={imgSize}
                  height={imgSize}
                  preserveAspectRatio="xMidYMid meet"
                  style={{ pointerEvents: 'none' }}
                />
              ) : (
                <text
                  x={cx} y={iconCy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={emojiFontSize}
                  style={{ userSelect: 'none', pointerEvents: 'none', letterSpacing: 0 }}
                >
                  {emoji}
                </text>
              )}
              {truncatedLabel && (
                <text
                  x={cx}
                  y={cy + ry * 0.62}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={labelFontSize}
                  fill="currentColor"
                  opacity={0.85}
                  style={{ userSelect: 'none', pointerEvents: 'none', letterSpacing: 0 }}
                >
                  {truncatedLabel}
                </text>
              )}
            </>
          );
        }}
        onEmptyClick={(x, y) => setPlacingAt({ x, y })}
        onMove={(placementId, x, y) => movePlacement({ placementId, x, y })}
        onResize={(placementId, widthFt, heightFt) => resizePlacement({ placementId, widthFt, heightFt })}
        getMenuItems={getMenuItems}
        storageKey={`canvas-zoom-bed-${bedId}`}
        defaultZoom={smartDefaultZoom}
        getItemLabel={(placementId) => {
          const placement = placementById.get(placementId);
          const plant = placement ? userPlantById.get(placement.userPlant) : undefined;
          if (!plant) return '';
          return plant.variety ? `${plant.plantName} — ${plant.variety}` : plant.plantName;
        }}
      />

      {mutationError && (
        <p className="mt-2 text-sm text-destructive">{mutationError}</p>
      )}

      {companionHints.length > 0 && (
        <div className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          <p className="font-medium mb-1 text-muted-foreground text-xs uppercase tracking-wide">Companion Planting</p>
          <ul className="space-y-0.5">
            {companionHints.map((hint) => (
              <li key={`${hint.plantAId}-${hint.plantBId}`} className="flex items-center gap-1.5">
                <span
                  className="inline-block size-2 rounded-full shrink-0"
                  style={{ background: hint.relationship === 'harmful' ? 'rgba(239,68,68,0.85)' : 'rgba(34,197,94,0.85)' }}
                />
                <span>
                  {hint.relationship === 'harmful' ? (
                    <><strong>{hint.plantAName}</strong> is incompatible with <strong>{hint.plantBName}</strong></>
                  ) : (
                    <><strong>{hint.plantAName}</strong> benefits <strong>{hint.plantBName}</strong></>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
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
                  onEdit={() => setEditingPlantId(plant.id)}
                  onDuplicate={() => clonePlant({ plantId: plant.id })}
                  onMove={() => setMovingPlantId(plant.id)}
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
        open={addPlantOpen}
        onOpenChange={(open) => { if (!open) setAddPlantOpen(false); }}
      />

      {editingPlant && (
        <PlantEditForm
          userPlant={editingPlant}
          open
          onOpenChange={(open) => { if (!open) setEditingPlantId(null); }}
        />
      )}

      {movingPlant && (
        <MovePlantDialog
          userPlant={movingPlant}
          open
          onOpenChange={(open) => { if (!open) setMovingPlantId(null); }}
        />
      )}

      {observingPlant && (
        <PlantObservationsSheet
          plant={observingPlant}
          gardenId={gardenId}
          bedId={bedId}
          open
          onOpenChange={(open) => { if (!open) setObservingPlantId(null); }}
        />
      )}
    </>
  );
}
