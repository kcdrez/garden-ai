import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EditIcon, ExternalLinkIcon, MinusCircleIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBedPlacementActions } from '@/hooks/useBedPlacementActions';
import { toFeet, fromFeet, formatDimensions } from '@/lib/beds';
import { getErrorMessage } from '@/lib/errors';
import { routes } from '@/lib/routes';
import { deleteBed, updateBed } from '@/api/beds';
import { useConfirm } from '@/hooks/useConfirm';
import type { BedPlacement, Garden, GardenBed } from '@/types/gardens';
import { makeOptimisticMutation } from '@/lib/mutations';
import BedDialog from '@/components/beds/BedDialog';
import PlaceBedDialog from '@/components/gardens/PlaceBedDialog';
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
  const [resizeError, setResizeError] = useState<string | null>(null);

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
  const unplacedBeds = beds.filter(
    (b) => !placements.some((p) => p.bed === b.id),
  );

  const items = placements.map((p) => ({
    id: p.id,
    x: p.x,
    y: p.y,
    widthFt: p.bedWidthFt,
    heightFt: p.bedHeightFt,
  }));

  function getMenuItems(placementId: string): CanvasMenuItem[] {
    const placement = placementById.get(placementId);
    const bed = placement ? bedById.get(placement.bed) : undefined;
    return [
      {
        label: 'Go to bed',
        icon: <ExternalLinkIcon className="size-4" />,
        onClick: () => {
          if (bed) navigate(routes.bedDetail(gardenId, bed.id));
        },
      },
      {
        label: 'Edit',
        icon: <EditIcon className="size-4" />,
        onClick: () => { if (bed) setEditingBed(bed); },
      },
      {
        label: 'Remove From Layout',
        icon: <MinusCircleIcon className="size-4" />,
        onClick: () => removePlacement(placementId),
      },
      {
        label: 'Delete',
        icon: <Trash2Icon className="size-4" />,
        variant: 'destructive' as const,
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

  return (
    <>
      <PlacementCanvas
        widthFt={gardenWidthFt}
        heightFt={gardenHeightFt}
        items={items}
        renderItem={(item) => {
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
        onMove={(placementId, x, y) => movePlacement({ placementId, x, y })}
        onResize={(placementId, widthFt, heightFt) => {
          const bed = bedById.get(placementById.get(placementId)?.bed ?? '');
          if (bed) resizeBedMutation.mutate({ placementId, bedId: bed.id, unit: bed.unit, widthFt, heightFt });
        }}
        getMenuItems={getMenuItems}
        storageKey={`canvas-zoom-garden-${gardenId}`}
        getItemLabel={(placementId) => {
          const placement = placementById.get(placementId);
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
          <Button size="sm" onClick={() => setAddBedOpen(true)}>
            <PlusIcon className="size-4" />
            Add Bed
          </Button>
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

      <PlaceBedDialog
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
      />

      <BedDialog
        gardenId={gardenId}
        open={addBedOpen}
        onOpenChange={setAddBedOpen}
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
