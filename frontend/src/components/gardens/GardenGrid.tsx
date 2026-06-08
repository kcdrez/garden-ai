import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EditIcon, ExternalLinkIcon, LandmarkIcon, MinusCircleIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBedPlacementActions } from '@/hooks/useBedPlacementActions';
import { useGardenFeaturePlacementActions } from '@/hooks/useGardenFeaturePlacementActions';
import { useUndoHistory } from '@/hooks/useUndoHistory';
import { toFeet, fromFeet, formatDimensions } from '@/lib/beds';
import { featureImage, featureEmoji, featureLabel, isCustomFeature } from '@/lib/features';
import { getErrorMessage } from '@/lib/errors';
import { routes } from '@/lib/routes';
import { deleteBed, updateBed } from '@/api/beds';
import { useConfirm } from '@/hooks/useConfirm';
import type { BedPlacement, Garden, GardenBed, GardenFeaturePlacement } from '@/types/gardens';
import { makeOptimisticMutation } from '@/lib/mutations';
import BedDialog from '@/components/beds/BedDialog';
import PlaceFeatureDialog from '@/components/shared/PlaceFeatureDialog';
import PlaceOnCanvasDialog from '@/components/gardens/PlaceOnCanvasDialog';
import PlacementCanvas from '@/components/shared/PlacementCanvas';
import type { CanvasMenuItem } from '@/types/canvas';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/query-state';

interface GardenGridProps {
  gardenId: string;
  garden: Garden;
  beds: GardenBed[];
}

export default function GardenGrid({
  gardenId,
  garden,
  beds,
}: GardenGridProps) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [placingAt, setPlacingAt] = useState<{ x: number; y: number } | null>(null);
  const [editingBed, setEditingBed] = useState<GardenBed | null>(null);
  const [addBedOpen, setAddBedOpen] = useState(false);
  const [addFeatureOpen, setAddFeatureOpen] = useState(false);
  const [resizeError, setResizeError] = useState<string | null>(null);

  const history = useUndoHistory();

  const deleteBedMutation = useMutation({
    mutationFn: (bedId: string) => deleteBed(gardenId, bedId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beds'] });
      queryClient.invalidateQueries({ queryKey: ['bed-placements', gardenId] });
    },
  });

  const {
    placements,
    isLoading,
    createPlacement,
    movePlacement,
    removePlacement,
    isCreating,
    createFailed,
    createError,
    resetCreate,
  } = useBedPlacementActions(gardenId);

  const {
    features,
    createFeature,
    moveFeature,
    resizeFeature,
    removeFeature,
  } = useGardenFeaturePlacementActions(gardenId);

  const bedPlacementsKey = ['bed-placements', gardenId] as const;

  const resizeBedMutation = useMutation({
    mutationFn: ({ bedId, unit, widthFt, heightFt }: {
      placementId: string; bedId: string; unit: string; widthFt: number; heightFt: number;
    }) =>
      updateBed(gardenId, bedId, {
        width: Math.round(fromFeet(widthFt, unit) * 10) / 10,
        length: Math.round(fromFeet(heightFt, unit) * 10) / 10,
      }),
    ...makeOptimisticMutation<BedPlacement, { placementId: string; bedId: string; unit: string; widthFt: number; heightFt: number }>(
      queryClient,
      bedPlacementsKey,
      (item, { widthFt, heightFt }) => ({ ...item, bedWidthFt: widthFt, bedHeightFt: heightFt }),
      (err) => setResizeError(getErrorMessage(err)),
    ),
    onSuccess: () => {
      setResizeError(null);
      queryClient.invalidateQueries({ queryKey: ['beds'] });
    },
  });

  if (garden.width == null || garden.length == null) return null;
  if (isLoading) return <LoadingSpinner />;

  const gardenWidthFt = toFeet(garden.width, garden.unit);
  const gardenHeightFt = toFeet(garden.length, garden.unit);

  const placementById = new Map(placements.map((p) => [p.id, p]));
  const bedById = new Map(beds.map((b) => [b.id, b]));
  const featureById = new Map(features.map((f) => [f.id, f]));
  const featureIds = new Set(features.map((f) => f.id));
  const unplacedBeds = beds.filter(
    (b) => !placements.some((p) => p.bed === b.id),
  );

  const bedItems = placements.map((p) => ({
    id: p.id,
    x: p.x,
    y: p.y,
    widthFt: p.bedWidthFt,
    heightFt: p.bedHeightFt,
  }));

  const featureItems = features.map((f) => ({
    id: f.id,
    x: f.x,
    y: f.y,
    widthFt: f.width,
    heightFt: f.height,
  }));

  const items = [...bedItems, ...featureItems];

  function getMenuItems(itemId: string): CanvasMenuItem[] {
    if (featureIds.has(itemId)) {
      const feature = featureById.get(itemId);
      return [
        {
          label: 'Delete',
          icon: <Trash2Icon className="size-4" />,
          primary: true,
          shortcut: 'Del',
          variant: 'destructive' as const,
          onClick: async () => {
            const name = feature ? (feature.label || featureLabel(feature.objectType)) : 'this feature';
            const ok = await confirm({ title: 'Delete feature?', description: `"${name}" will be permanently deleted.` });
            if (ok) removeFeature(itemId);
          },
        },
      ];
    }

    const placement = placementById.get(itemId);
    const bed = placement ? bedById.get(placement.bed) : undefined;
    return [
      {
        label: 'View Details',
        icon: <ExternalLinkIcon className="size-4" />,
        primary: true,
        shortcut: 'v',
        onClick: () => {
          if (bed) navigate(routes.bedDetail(gardenId, bed.id));
        },
      },
      {
        label: 'Edit',
        icon: <EditIcon className="size-4" />,
        primary: true,
        shortcut: 'e',
        onClick: () => { if (bed) setEditingBed(bed); },
      },
      {
        label: 'Remove From Layout',
        icon: <MinusCircleIcon className="size-4" />,
        primary: true,
        shortcut: 'r',
        onClick: () => removePlacement(itemId),
      },
      {
        label: 'Delete',
        icon: <Trash2Icon className="size-4" />,
        variant: 'destructive' as const,
        primary: true,
        shortcut: 'Del',
        onClick: async () => {
          if (!bed) return;
          const ok = await confirm({
            title: 'Delete bed?',
            description: `"${bed.name}" and all its plants will be permanently deleted.`,
          });
          if (ok) deleteBedMutation.mutate(bed.id);
        },
      },
    ];
  }

  async function handleDeleteItems(itemIds: string[]) {
    const bedPlacementIds = itemIds.filter((id) => !featureIds.has(id));
    const fIds = itemIds.filter((id) => featureIds.has(id));
    if (bedPlacementIds.length === 0 && fIds.length === 0) return;

    const total = bedPlacementIds.length + fIds.length;
    const parts: string[] = [];
    if (bedPlacementIds.length > 0) parts.push(`${bedPlacementIds.length} bed${bedPlacementIds.length > 1 ? 's' : ''} and all their plants`);
    if (fIds.length > 0) parts.push(`${fIds.length} feature${fIds.length > 1 ? 's' : ''}`);

    const ok = await confirm({
      title: `Delete ${total} item${total > 1 ? 's' : ''}?`,
      description: `${parts.join(' and ')} will be permanently deleted.`,
    });
    if (!ok) return;
    for (const id of bedPlacementIds) {
      const placement = placementById.get(id);
      if (placement) deleteBedMutation.mutate(placement.bed);
    }
    for (const id of fIds) removeFeature(id);
  }

  function renderFeatureItem(item: { widthFt: number; heightFt: number }, feature: GardenFeaturePlacement) {
    const custom = isCustomFeature(feature.objectType);
    const img = custom ? null : featureImage(feature.objectType);
    const emoji = custom ? null : featureEmoji(feature.objectType);
    const displayLabel = custom ? feature.label : (feature.label || featureLabel(feature.objectType));
    const isCircle = feature.shape === 'circle';
    const cx = item.widthFt / 2;
    const cy = item.heightFt / 2;
    const rx = item.widthFt / 2;
    const ry = item.heightFt / 2;
    const minDim = Math.min(item.widthFt, item.heightFt);
    const imgSize = minDim * 0.6;
    const emojiFontSize = minDim * 0.5;
    const labelFontSize = Math.max(0.12, minDim * 0.14);
    const charRatio = 0.55;
    const maxLabelWidth = item.widthFt - 0.2;
    const truncatedLabel = displayLabel.length * labelFontSize * charRatio > maxLabelWidth
      ? displayLabel.slice(0, Math.floor(maxLabelWidth / (labelFontSize * charRatio)) - 1) + '…'
      : displayLabel;
    const iconCy = (!custom && displayLabel) ? cy - minDim * 0.08 : cy;

    return (
      <>
        {isCircle ? (
          <ellipse
            cx={cx} cy={cy} rx={rx} ry={ry}
            className="fill-amber-500/15 stroke-amber-600/50"
            strokeWidth={0.05}
          />
        ) : (
          <rect
            x={0} y={0} width={item.widthFt} height={item.heightFt}
            className="fill-amber-500/15 stroke-amber-600/50"
            strokeWidth={0.05}
            rx={0.1}
          />
        )}
        {!custom && (img ? (
          <image
            href={img}
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
        ))}
        {truncatedLabel && (
          <text
            x={cx}
            y={custom ? cy : isCircle ? cy + ry * 0.6 : item.heightFt - labelFontSize * 0.8}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={labelFontSize}
            className="fill-amber-800 dark:fill-amber-300"
            style={{ userSelect: 'none', pointerEvents: 'none', letterSpacing: 0 }}
          >
            {truncatedLabel}
          </text>
        )}
      </>
    );
  }

  return (
    <>
      <PlacementCanvas
        widthFt={gardenWidthFt}
        heightFt={gardenHeightFt}
        items={items}
        onDeleteItems={handleDeleteItems}
        renderItem={(item) => {
          if (featureIds.has(item.id)) {
            return renderFeatureItem(item, featureById.get(item.id)!);
          }
          const placement = placementById.get(item.id);
          const bed = placement ? bedById.get(placement.bed) : undefined;
          const fontSize = Math.max(
            0.2,
            Math.min(item.widthFt, item.heightFt) * 0.18,
          );
          const availableWidth = item.widthFt - 0.2;
          const charRatio = 0.55;
          const nameFontSize = bed?.name
            ? Math.min(fontSize, availableWidth / (bed.name.length * charRatio))
            : fontSize;
          const dimText = bed ? formatDimensions(bed) : '';
          const dimFontSize = dimText
            ? Math.min(fontSize * 0.8, availableWidth / (dimText.length * charRatio))
            : fontSize * 0.8;
          return (
            <>
              <rect
                x={0}
                y={0}
                width={item.widthFt}
                height={item.heightFt}
                className="fill-primary/20 stroke-primary/50"
                strokeWidth={0.06}
                rx={0.12}
              />
              <text
                x={item.widthFt / 2}
                y={item.heightFt / 2 - nameFontSize * 0.6}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={nameFontSize}
                className="fill-foreground"
                style={{
                  userSelect: 'none',
                  pointerEvents: 'none',
                  letterSpacing: 0,
                }}
              >
                {bed?.name}
              </text>
              {bed && (
                <text
                  x={item.widthFt / 2}
                  y={item.heightFt / 2 + dimFontSize * 0.7}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={dimFontSize}
                  className="fill-muted-foreground"
                  style={{
                    userSelect: 'none',
                    pointerEvents: 'none',
                    letterSpacing: 0,
                  }}
                >
                  {dimText}
                </text>
              )}
            </>
          );
        }}
        onEmptyClick={(x, y) => setPlacingAt({ x, y })}
        onMove={(id, x, y) => {
          const prev = items.find(i => i.id === id);
          const isFeature = featureIds.has(id);
          if (prev) {
            history.push({
              undo: () => {
                if (isFeature) moveFeature({ featureId: id, x: prev.x, y: prev.y });
                else movePlacement({ placementId: id, x: prev.x, y: prev.y });
              },
              redo: () => {
                if (isFeature) moveFeature({ featureId: id, x, y });
                else movePlacement({ placementId: id, x, y });
              },
            });
          }
          if (isFeature) moveFeature({ featureId: id, x, y });
          else movePlacement({ placementId: id, x, y });
        }}
        onGroupMoveEnd={(moves) => {
          const movesWithMeta = moves.map(({ id, x, y }) => ({
            id, x, y, isFeature: featureIds.has(id),
          }));
          const prevPositions = movesWithMeta.map(({ id, isFeature }) => {
            const item = items.find(i => i.id === id);
            return { id, isFeature, x: item?.x ?? 0, y: item?.y ?? 0 };
          });
          history.push({
            undo: () => prevPositions.forEach(({ id, isFeature, x, y }) => {
              if (isFeature) moveFeature({ featureId: id, x, y });
              else movePlacement({ placementId: id, x, y });
            }),
            redo: () => movesWithMeta.forEach(({ id, isFeature, x, y }) => {
              if (isFeature) moveFeature({ featureId: id, x, y });
              else movePlacement({ placementId: id, x, y });
            }),
          });
          movesWithMeta.forEach(({ id, isFeature, x, y }) => {
            if (isFeature) moveFeature({ featureId: id, x, y });
            else movePlacement({ placementId: id, x, y });
          });
        }}
        onResize={(id, widthFt, heightFt) => {
          const prev = items.find(i => i.id === id);
          const isFeature = featureIds.has(id);
          const bed = !isFeature ? bedById.get(placementById.get(id)?.bed ?? '') : undefined;
          if (prev) {
            history.push({
              undo: () => {
                if (isFeature) resizeFeature({ featureId: id, width: prev.widthFt, height: prev.heightFt });
                else if (bed) resizeBedMutation.mutate({ placementId: id, bedId: bed.id, unit: bed.unit, widthFt: prev.widthFt, heightFt: prev.heightFt });
              },
              redo: () => {
                if (isFeature) resizeFeature({ featureId: id, width: widthFt, height: heightFt });
                else if (bed) resizeBedMutation.mutate({ placementId: id, bedId: bed.id, unit: bed.unit, widthFt, heightFt });
              },
            });
          }
          if (isFeature) resizeFeature({ featureId: id, width: widthFt, height: heightFt });
          else if (bed) resizeBedMutation.mutate({ placementId: id, bedId: bed.id, unit: bed.unit, widthFt, heightFt });
        }}
        onUndo={history.undo}
        onRedo={history.redo}
        getMenuItems={getMenuItems}
        storageKey={`canvas-zoom-garden-${gardenId}`}
        getItemLabel={(itemId) => {
          if (featureIds.has(itemId)) {
            const f = featureById.get(itemId);
            return f ? (f.label || featureLabel(f.objectType)) : '';
          }
          const placement = placementById.get(itemId);
          const bed = placement ? bedById.get(placement.bed) : undefined;
          return bed?.name ?? '';
        }}
      />

      {resizeError && (
        <p className="mt-2 text-sm text-destructive">{resizeError}</p>
      )}

      <div className="mt-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2>Unplaced Beds</h2>
            {unplacedBeds.length > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">Click the garden layout to place</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setAddFeatureOpen(true)}>
              <LandmarkIcon className="size-4" />
              Add Feature
            </Button>
            <Button size="sm" onClick={() => setAddBedOpen(true)}>
              <PlusIcon className="size-4" />
              Add Bed
            </Button>
          </div>
        </div>
        {unplacedBeds.length === 0 ? (
          <p className="text-sm text-muted-foreground">All beds are placed in the garden.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {unplacedBeds.map((bed) => (
              <div
                key={bed.id}
                className="flex flex-col px-3 py-1.5 bg-primary/10 border border-primary/20 rounded text-xs"
              >
                <span>{bed.name}</span>
                <span className="text-muted-foreground">{formatDimensions(bed)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <PlaceOnCanvasDialog
        open={!!placingAt}
        onOpenChange={(open) => {
          if (!open) {
            setPlacingAt(null);
            resetCreate();
          }
        }}
        cell={placingAt}
        gardenId={gardenId}
        unplacedBeds={unplacedBeds}
        onPlace={(bedId) =>
          createPlacement({ bedId, x: placingAt!.x, y: placingAt!.y }, () => setPlacingAt(null))
        }
        isPlacing={isCreating}
        placeError={createFailed ? getErrorMessage(createError) : null}
        onPlaceFeature={(objectType, label) =>
          createFeature(
            { objectType, label, x: placingAt!.x, y: placingAt!.y, width: 2, height: 2 },
            () => setPlacingAt(null),
          )
        }
      />

      <BedDialog
        gardenId={gardenId}
        open={addBedOpen}
        onOpenChange={setAddBedOpen}
      />

      <PlaceFeatureDialog
        open={addFeatureOpen}
        onOpenChange={setAddFeatureOpen}
        scope="garden"
        onPlace={(objectType, label) =>
          createFeature(
            { objectType, label, x: 0.5, y: 0.5, width: 2, height: 2 },
            () => setAddFeatureOpen(false),
          )
        }
      />

      {editingBed && (
        <BedDialog
          gardenId={gardenId}
          bed={editingBed}
          open
          onOpenChange={(open) => { if (!open) setEditingBed(null); }}
        />
      )}
    </>
  );
}
