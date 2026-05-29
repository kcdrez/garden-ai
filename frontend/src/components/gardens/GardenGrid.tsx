import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalLinkIcon, Trash2Icon } from 'lucide-react';
import { fetchBedPlacements, createBedPlacement, moveBedPlacement, deleteBedPlacement } from '@/api/beds';
import { toFeet, formatDimensions } from '@/lib/beds';
import { getErrorMessage } from '@/lib/errors';
import { routes } from '@/lib/routes';
import type { BedPlacement, Garden, GardenBed } from '@/types/gardens';
import PlaceBedDialog from '@/components/gardens/PlaceBedDialog';
import PlacementCanvas from '@/components/shared/PlacementCanvas';
import type { CanvasItem, CanvasMenuItem } from '@/types/canvas';
import { LoadingSpinner } from '@/components/ui/query-state';

interface GardenGridProps {
  gardenId: string;
  garden: Garden;
  beds: GardenBed[];
}

export default function GardenGrid({ gardenId, garden, beds }: GardenGridProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [placingAt, setPlacingAt] = useState<{ x: number; y: number } | null>(null);

  const { data: placements = [], isLoading } = useQuery({
    queryKey: ['bed-placements', gardenId],
    queryFn: () => fetchBedPlacements(gardenId),
  });

  const createMutation = useMutation({
    mutationFn: ({ bedId, x, y }: { bedId: string; x: number; y: number }) =>
      createBedPlacement(gardenId, { bed: bedId, x, y }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bed-placements', gardenId] });
      setPlacingAt(null);
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ placementId, x, y }: { placementId: string; x: number; y: number }) =>
      moveBedPlacement(gardenId, placementId, x, y),
    onMutate: async ({ placementId, x, y }) => {
      await queryClient.cancelQueries({ queryKey: ['bed-placements', gardenId] });
      const previous = queryClient.getQueryData<BedPlacement[]>(['bed-placements', gardenId]);
      queryClient.setQueryData<BedPlacement[]>(['bed-placements', gardenId], (old = []) =>
        old.map((p) => (p.id === placementId ? { ...p, x, y } : p)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['bed-placements', gardenId], context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['bed-placements', gardenId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (placementId: string) => deleteBedPlacement(gardenId, placementId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bed-placements', gardenId] }),
  });

  if (garden.width == null || garden.length == null) return null;
  if (isLoading) return <LoadingSpinner />;

  const gardenWidthFt = toFeet(garden.width, garden.unit);
  const gardenHeightFt = toFeet(garden.length, garden.unit);

  const placementById = new Map<string, BedPlacement>(placements.map((p) => [p.id, p]));
  const bedById = new Map<string, GardenBed>(beds.map((b) => [b.id, b]));
  const unplacedBeds = beds.filter((b) => !placements.some((p) => p.bed === b.id));

  const items: CanvasItem[] = placements.map((p) => ({
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
        label: 'Remove from layout',
        icon: <Trash2Icon className="size-4" />,
        variant: 'destructive' as const,
        onClick: () => deleteMutation.mutate(placementId),
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
          const fontSize = Math.max(0.2, Math.min(item.widthFt, item.heightFt) * 0.18);
          return (
            <>
              <rect
                x={0} y={0}
                width={item.widthFt} height={item.heightFt}
                className="fill-primary/20 stroke-primary/50"
                strokeWidth={0.06}
                rx={0.12}
              />
              <text
                x={item.widthFt / 2}
                y={item.heightFt / 2 - fontSize * 0.6}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                className="fill-foreground"
                style={{ userSelect: 'none', pointerEvents: 'none', letterSpacing: 0 }}
              >
                {bed?.name}
              </text>
              {bed && (
                <text
                  x={item.widthFt / 2}
                  y={item.heightFt / 2 + fontSize * 0.7}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={fontSize * 0.8}
                  className="fill-muted-foreground"
                  style={{ userSelect: 'none', pointerEvents: 'none', letterSpacing: 0 }}
                >
                  {formatDimensions(bed)}
                </text>
              )}
            </>
          );
        }}
        onEmptyClick={(x, y) => setPlacingAt({ x, y })}
        onMove={(placementId, x, y) => moveMutation.mutate({ placementId, x, y })}
        getMenuItems={getMenuItems}
      />

      {unplacedBeds.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-2">
            Unplaced beds — click the canvas to place
          </p>
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
        </div>
      )}

      <PlaceBedDialog
        open={!!placingAt}
        onOpenChange={(open) => {
          if (!open) {
            setPlacingAt(null);
            createMutation.reset();
          }
        }}
        cell={placingAt}
        unplacedBeds={unplacedBeds}
        onPlace={(bedId) => createMutation.mutate({ bedId, x: placingAt!.x, y: placingAt!.y })}
        isPlacing={createMutation.isPending}
        placeError={createMutation.isError ? getErrorMessage(createMutation.error) : null}
      />
    </>
  );
}
