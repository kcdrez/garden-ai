import { useRef, useState, useEffect } from 'react';
import { HelpCircleIcon } from 'lucide-react';
import CanvasShortcutsDialog from '@/components/shared/CanvasShortcutsDialog';
import { DraggableItem } from '@/components/shared/DraggableItem';
import PlacementGrid from '@/components/shared/PlacementGrid';
import PlacementToolbar from '@/components/shared/PlacementToolbar';
import { usePlacementZoom } from '@/hooks/usePlacementZoom';
import { usePlacementKeyboard } from '@/hooks/usePlacementKeyboard';
import { cn } from '@/lib/utils';
import {
  ZOOM_LEVELS,
  PAD,
  CLICK_THRESHOLD_FT,
  toSVGPoint,
  toFloatingToolbarPosition,
  type ZoomLevel,
  type FloatingToolbarPosition,
} from '@/lib/placementCanvas';
import type { CanvasItem, CanvasMenuItem } from '@/types/canvas';

interface PlacementCanvasProps {
  widthFt: number;
  heightFt: number;
  items: CanvasItem[];
  renderItem: (item: CanvasItem) => React.ReactNode;
  onEmptyClick: (xFt: number, yFt: number) => void;
  onMove: (id: string, xFt: number, yFt: number) => void;
  onResize?: (id: string, widthFt: number, heightFt: number) => void;
  onDeleteItems?: (ids: string[]) => void;
  onCopyItem?: (id: string) => void;
  onPasteItem?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onGroupMoveEnd?: (moves: Array<{ id: string; x: number; y: number }>) => void;
  getMenuItems: (id: string) => CanvasMenuItem[];
  storageKey?: string;
  defaultZoom?: ZoomLevel;
  getItemLabel?: (id: string) => string;
}

export default function PlacementCanvas({
  widthFt,
  heightFt,
  items,
  renderItem,
  onEmptyClick,
  onMove,
  onResize,
  onDeleteItems,
  onCopyItem,
  onPasteItem,
  onUndo,
  onRedo,
  onGroupMoveEnd,
  getMenuItems,
  storageKey,
  defaultZoom = 1,
  getItemLabel,
}: PlacementCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bgClickStart = useRef<{ x: number; y: number } | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toolbarAnchor, setToolbarAnchor] = useState<FloatingToolbarPosition | null>(null);
  const [dragGroupDelta, setDragGroupDelta] = useState<{ dx: number; dy: number } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const { zoom, setZoom, zoomIn, zoomOut } = usePlacementZoom(storageKey, defaultZoom);

  function computeGroupAnchor(ids: Set<string>, posItems: CanvasItem[]): FloatingToolbarPosition | null {
    if (!svgRef.current || ids.size === 0) return null;
    const selected = posItems.filter(i => ids.has(i.id));
    if (selected.length === 0) return null;
    const minX = Math.min(...selected.map(i => i.x));
    const maxX = Math.max(...selected.map(i => i.x + i.widthFt));
    const minY = Math.min(...selected.map(i => i.y));
    return toFloatingToolbarPosition({ x: minX, y: minY, widthFt: maxX - minX }, svgRef.current);
  }

  function handleSelect(id: string, shiftKey: boolean) {
    const newIds = new Set(shiftKey ? selectedIds : new Set<string>());
    if (shiftKey && newIds.has(id)) {
      newIds.delete(id);
    } else {
      newIds.add(id);
    }
    setSelectedIds(newIds);
    setToolbarAnchor(newIds.size > 0 ? computeGroupAnchor(newIds, items) : null);
  }

  function handleGroupDragEnd(dx: number, dy: number) {
    setDragGroupDelta(null);
    const moves: Array<{ id: string; x: number; y: number }> = [];
    const newPositions: CanvasItem[] = [];
    for (const id of selectedIds) {
      const item = items.find(i => i.id === id);
      if (!item) continue;
      const newX = Math.max(0, Math.min(item.x + dx, widthFt - item.widthFt));
      const newY = Math.max(0, Math.min(item.y + dy, heightFt - item.heightFt));
      moves.push({ id, x: newX, y: newY });
      newPositions.push({ ...item, x: newX, y: newY });
    }
    if (onGroupMoveEnd) {
      onGroupMoveEnd(moves);
    } else {
      for (const { id, x, y } of moves) onMove(id, x, y);
    }
    setToolbarAnchor(computeGroupAnchor(selectedIds, newPositions));
  }

  // Deselect when clicking outside the canvas container
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !target.closest?.('[data-radix-popper-content-wrapper], [role="menu"], [role="dialog"], [role="alertdialog"]')
      ) {
        setSelectedIds(new Set());
        setToolbarAnchor(null);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  usePlacementKeyboard({
    selectedIds,
    setSelectedIds,
    setToolbarAnchor,
    computeGroupAnchor,
    items,
    widthFt,
    heightFt,
    svgRef,
    getMenuItems,
    onMove,
    onDeleteItems,
    onCopyItem,
    onPasteItem,
    onUndo,
    onRedo,
    zoomIn,
    zoomOut,
    setShowHelp,
  });

  const viewBox = `${-PAD} ${-PAD} ${widthFt + PAD * 2} ${heightFt + PAD * 2}`;

  function handleBgPointerDown(e: React.PointerEvent<SVGRectElement>) {
    const coords = toSVGPoint(e.nativeEvent, svgRef.current!);
    bgClickStart.current = coords;
  }

  function handleBgPointerUp(e: React.PointerEvent<SVGRectElement>) {
    if (!bgClickStart.current) return;
    const coords = toSVGPoint(e.nativeEvent, svgRef.current!);
    const dist = Math.hypot(
      coords.x - bgClickStart.current.x,
      coords.y - bgClickStart.current.y,
    );
    if (dist < CLICK_THRESHOLD_FT) {
      if (selectedIds.size > 0) {
        setSelectedIds(new Set());
        setToolbarAnchor(null);
      } else {
        onEmptyClick(
          Math.max(0, Math.min(coords.x, widthFt)),
          Math.max(0, Math.min(coords.y, heightFt)),
        );
      }
    }
    bgClickStart.current = null;
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setToolbarAnchor(null);
  }

  const [id] = selectedIds;
  const selectedMenuItems = selectedIds.size === 1 ? getMenuItems(id) : [];

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="flex justify-end gap-1">
        {ZOOM_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setZoom(level)}
            className={cn(
              'px-2 py-0.5 text-xs rounded border transition-colors',
              zoom === level
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/50',
            )}
          >
            {level}×
          </button>
        ))}
        <div className="w-px h-4 bg-foreground/20 mx-1 self-center" />
        <button
          type="button"
          aria-label="Keyboard shortcuts"
          onClick={() => setShowHelp(true)}
          className="px-2 py-0.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
        >
          <HelpCircleIcon className="size-3" />
        </button>
      </div>

      <div
        className="overflow-x-auto min-h-[200px]"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) clearSelection();
        }}
      >
        <svg
          ref={svgRef}
          data-testid="canvas-svg"
          viewBox={viewBox}
          style={{
            width: `${zoom * 100}%`,
            height: 'auto',
            display: 'block',
            margin: zoom < 1 ? '0 auto' : undefined,
          }}
        >
          {/* Background: click-to-place target */}
          <rect
            x={0}
            y={0}
            width={widthFt}
            height={heightFt}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
            onPointerDown={handleBgPointerDown}
            onPointerUp={handleBgPointerUp}
          />

          <PlacementGrid widthFt={widthFt} heightFt={heightFt} />

          {items.map((item) => (
            <DraggableItem
              key={item.id}
              item={item}
              containerWidthFt={widthFt}
              containerHeightFt={heightFt}
              zoom={zoom}
              label={getItemLabel?.(item.id)}
              renderItem={renderItem}
              onMove={onMove}
              onResize={onResize}
              onSelect={handleSelect}
              isSelected={selectedIds.has(item.id)}
              isInGroup={selectedIds.size > 1 && selectedIds.has(item.id)}
              groupDelta={selectedIds.has(item.id) ? dragGroupDelta : null}
              onDragDelta={(dx, dy) => setDragGroupDelta({ dx, dy })}
              onGroupDragEnd={handleGroupDragEnd}
            />
          ))}
        </svg>

        {toolbarAnchor && selectedIds.size > 0 && (
          <PlacementToolbar
            anchor={toolbarAnchor}
            selectedCount={selectedIds.size}
            menuItems={selectedMenuItems}
            onClearSelection={clearSelection}
            onDeleteAll={() => onDeleteItems?.(Array.from(selectedIds))}
          />
        )}
      </div>

      <CanvasShortcutsDialog open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
