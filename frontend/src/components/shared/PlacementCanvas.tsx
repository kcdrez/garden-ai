import { useRef, useState, useEffect } from 'react';
import { HelpCircleIcon, MoreHorizontalIcon, Trash2Icon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import CanvasShortcutsDialog from '@/components/shared/CanvasShortcutsDialog';
import { cn } from '@/lib/utils';

import type { CanvasItem, CanvasMenuItem } from '@/types/canvas';

const ZOOM_LEVELS = [0.25, 0.5, 1, 2, 3] as const;

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
  defaultZoom?: (typeof ZOOM_LEVELS)[number];
  getItemLabel?: (id: string) => string;
}

const PAD = 0.4;
const CLICK_THRESHOLD_FT = 0.15;
const DRAG_THRESHOLD_PX = 6;
const MIN_PLACEMENT_SIZE = 0.5;

function toSVGPoint(
  e: PointerEvent | MouseEvent,
  svg: SVGSVGElement,
): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
  return { x: svgPt.x, y: svgPt.y };
}

type FloatingToolbarPosition = { top: number; left: number; width: number };

function toFloatingToolbarPosition(
  item: { x: number; y: number; widthFt: number },
  svg: SVGSVGElement,
): FloatingToolbarPosition {
  const ctm = svg.getScreenCTM()!;
  const tl = svg.createSVGPoint();
  tl.x = item.x; tl.y = item.y;
  const tlScreen = tl.matrixTransform(ctm);
  const tr = svg.createSVGPoint();
  tr.x = item.x + item.widthFt; tr.y = item.y;
  const trScreen = tr.matrixTransform(ctm);
  return { top: tlScreen.y, left: tlScreen.x, width: trScreen.x - tlScreen.x };
}

function DraggableItem({
  item,
  containerWidthFt,
  containerHeightFt,
  zoom,
  label,
  renderItem,
  onMove,
  onResize,
  onSelect,
  isSelected,
  isInGroup,
  groupDelta,
  onDragDelta,
  onGroupDragEnd,
}: {
  item: CanvasItem;
  containerWidthFt: number;
  containerHeightFt: number;
  zoom: number;
  label?: string;
  renderItem: (item: CanvasItem) => React.ReactNode;
  onMove: (id: string, x: number, y: number) => void;
  onResize?: (id: string, widthFt: number, heightFt: number) => void;
  onSelect: (id: string, shiftKey: boolean) => void;
  isSelected: boolean;
  isInGroup: boolean;
  groupDelta: { dx: number; dy: number } | null;
  onDragDelta?: (dx: number, dy: number) => void;
  onGroupDragEnd?: (dx: number, dy: number) => void;
}) {
  const [pos, setPos] = useState({ x: item.x, y: item.y });
  const [size, setSize] = useState({ w: item.widthFt, h: item.heightFt });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStart = useRef<{
    svgX: number;
    svgY: number;
    itemX: number;
    itemY: number;
    clientX: number;
    clientY: number;
    shiftKey: boolean;
  } | null>(null);
  const resizeStart = useRef<{
    svgX: number;
    svgY: number;
    w: number;
    h: number;
  } | null>(null);
  const hasMoved = useRef(false);
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!isDragging && !isResizing) {
      setPos({ x: item.x, y: item.y });
      setSize({ w: item.widthFt, h: item.heightFt });
    }
  }, [item.x, item.y, item.widthFt, item.heightFt, isDragging, isResizing]);

  function handlePointerDown(e: React.PointerEvent<SVGGElement>) {
    e.stopPropagation();
    const svg = gRef.current!.ownerSVGElement!;
    const coords = toSVGPoint(e.nativeEvent, svg);
    dragStart.current = {
      svgX: coords.x,
      svgY: coords.y,
      itemX: pos.x,
      itemY: pos.y,
      clientX: e.clientX,
      clientY: e.clientY,
      shiftKey: e.shiftKey || e.metaKey,
    };
    hasMoved.current = false;
    setIsDragging(true);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }

  function handleResizePointerDown(e: React.PointerEvent<SVGElement>) {
    e.stopPropagation();
    const svg = gRef.current!.ownerSVGElement!;
    const coords = toSVGPoint(e.nativeEvent, svg);
    resizeStart.current = {
      svgX: coords.x,
      svgY: coords.y,
      w: size.w,
      h: size.h,
    };
    setIsResizing(true);
    gRef.current!.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<SVGGElement>) {
    if (isDragging && !hasMoved.current && dragStart.current) {
      const dx = e.clientX - dragStart.current.clientX;
      const dy = e.clientY - dragStart.current.clientY;
      if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) hasMoved.current = true;
    } else if (isResizing && !hasMoved.current) {
      hasMoved.current = true;
    }
    if (isDragging && hasMoved.current && dragStart.current) {
      const svg = gRef.current!.ownerSVGElement!;
      const coords = toSVGPoint(e.nativeEvent, svg);
      const newX = Math.max(
        0,
        Math.min(
          dragStart.current.itemX + (coords.x - dragStart.current.svgX),
          containerWidthFt - size.w,
        ),
      );
      const newY = Math.max(
        0,
        Math.min(
          dragStart.current.itemY + (coords.y - dragStart.current.svgY),
          containerHeightFt - size.h,
        ),
      );
      setPos({ x: newX, y: newY });
      if (isInGroup) onDragDelta?.(newX - item.x, newY - item.y);
    } else if (isResizing && hasMoved.current && resizeStart.current) {
      const svg = gRef.current!.ownerSVGElement!;
      const coords = toSVGPoint(e.nativeEvent, svg);
      const newW = Math.max(
        MIN_PLACEMENT_SIZE,
        Math.min(
          resizeStart.current.w + (coords.x - resizeStart.current.svgX),
          containerWidthFt - pos.x,
        ),
      );
      const newH = Math.max(
        MIN_PLACEMENT_SIZE,
        Math.min(
          resizeStart.current.h + (coords.y - resizeStart.current.svgY),
          containerHeightFt - pos.y,
        ),
      );
      setSize({ w: newW, h: newH });
    }
  }

  // Handles both normal release and out-of-window release. Since setPointerCapture is always called
  // for move and resize, lostpointercapture fires after every pointerup — so this covers both cases.
  function handleLostPointerCapture() {
    if (isDragging) {
      setIsDragging(false);
      const shiftKey = dragStart.current?.shiftKey ?? false;
      dragStart.current = null;
      if (hasMoved.current) {
        if (isInGroup) {
          onGroupDragEnd?.(pos.x - item.x, pos.y - item.y);
        } else {
          if (pos.x !== item.x || pos.y !== item.y) onMove(item.id, pos.x, pos.y);
          onSelect(item.id, false);
        }
      } else {
        onSelect(item.id, shiftKey);
      }
    } else if (isResizing) {
      setIsResizing(false);
      resizeStart.current = null;
      if (size.w !== item.widthFt || size.h !== item.heightFt) {
        onResize?.(item.id, size.w, size.h);
      }
    }
  }

  const handleR = Math.min(0.05 / zoom, Math.min(size.w, size.h) * 0.125);

  // Non-dragging group items render at their offset position while another item is being dragged.
  const displayX = isInGroup && groupDelta && !isDragging
    ? Math.max(0, Math.min(item.x + groupDelta.dx, containerWidthFt - size.w))
    : pos.x;
  const displayY = isInGroup && groupDelta && !isDragging
    ? Math.max(0, Math.min(item.y + groupDelta.dy, containerHeightFt - size.h))
    : pos.y;

  return (
    <g
      ref={gRef}
      style={{
        cursor: isDragging ? 'grabbing' : isResizing ? 'se-resize' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onLostPointerCapture={handleLostPointerCapture}
    >
      <g
        transform={`translate(${displayX}, ${displayY})`}
        opacity={isDragging || isResizing ? 0.65 : 1}
      >
        {label && <title>{label}</title>}
        {/* Transparent hit rect — ensures the <g> has a defined pointer area */}
        <rect x={0} y={0} width={size.w} height={size.h} fill="transparent" />

        {renderItem({ ...item, x: displayX, y: displayY, widthFt: size.w, heightFt: size.h })}

        {isSelected && (
          <>
            <rect
              x={-0.06} y={-0.06}
              width={size.w + 0.12} height={size.h + 0.12}
              rx={0.12}
              pointerEvents="none"
              style={{
                fill: 'none',
                stroke: 'var(--primary)',
                strokeWidth: 0.055,
                strokeDasharray: '0.18 0.1',
                animation: 'marching-ants 1s linear infinite',
              }}
            />
            {onResize && !isInGroup && (
              <circle
                data-testid="resize-handle"
                cx={size.w} cy={size.h} r={handleR}
                stroke="white"
                strokeWidth={handleR * 0.35}
                style={{ cursor: 'se-resize', fill: 'var(--primary)' }}
                onPointerDown={handleResizePointerDown}
              />
            )}
          </>
        )}
      </g>
    </g>
  );
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
  const [toolbarAnchor, setFloatingToolbarPosition] = useState<FloatingToolbarPosition | null>(null);
  const [dragGroupDelta, setDragGroupDelta] = useState<{ dx: number; dy: number } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

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
    setFloatingToolbarPosition(newIds.size > 0 ? computeGroupAnchor(newIds, items) : null);
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
    setFloatingToolbarPosition(computeGroupAnchor(selectedIds, newPositions));
  }

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !target.closest?.('[data-radix-popper-content-wrapper], [role="menu"], [role="dialog"], [role="alertdialog"]')
      ) {
        setSelectedIds(new Set());
        setFloatingToolbarPosition(null);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (selectedIds.size === 0) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (selectedIds.size === 0) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (target.closest('[role="dialog"], [role="alertdialog"]')) return;

      if (e.key === 'Escape') {
        setSelectedIds(new Set());
        setFloatingToolbarPosition(null);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedIds.size === 1) {
        e.preventDefault();
        const [id] = selectedIds;
        onCopyItem?.(id);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedIds.size === 1) {
          const [id] = selectedIds;
          const deleteItem = getMenuItems(id).find(mi => mi.variant === 'destructive');
          deleteItem?.onClick();
        } else {
          onDeleteItems?.(Array.from(selectedIds));
        }
        setSelectedIds(new Set());
        setFloatingToolbarPosition(null);
        return;
      }

      if (selectedIds.size === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.length === 1) {
        const [id] = selectedIds;
        const match = getMenuItems(id).find(mi => mi.shortcut === e.key);
        if (match) {
          e.preventDefault();
          match.onClick();
          setSelectedIds(new Set());
          setFloatingToolbarPosition(null);
          return;
        }
      }

      if (e.key === 'Tab') {
        if (items.length === 0 || !svgRef.current) return;
        e.preventDefault();
        const sorted = [...items].sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);
        const primaryId = selectedIds.size === 1 ? [...selectedIds][0] : null;
        const currentIndex = primaryId ? sorted.findIndex(i => i.id === primaryId) : -1;
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + sorted.length) % sorted.length
          : (currentIndex + 1) % sorted.length;
        const next = sorted[nextIndex];
        const newIds = new Set([next.id]);
        setSelectedIds(newIds);
        setFloatingToolbarPosition(computeGroupAnchor(newIds, items));
        return;
      }

      const NUDGE = e.shiftKey ? 1 : 0.1;
      const ndx = e.key === 'ArrowLeft' ? -NUDGE : e.key === 'ArrowRight' ? NUDGE : 0;
      const ndy = e.key === 'ArrowUp' ? -NUDGE : e.key === 'ArrowDown' ? NUDGE : 0;
      if (ndx === 0 && ndy === 0) return;
      e.preventDefault();

      if (!svgRef.current) return;
      const newPositions: CanvasItem[] = [];
      for (const id of selectedIds) {
        const item = items.find(i => i.id === id);
        if (!item) continue;
        const newX = Math.max(0, Math.min(item.x + ndx, widthFt - item.widthFt));
        const newY = Math.max(0, Math.min(item.y + ndy, heightFt - item.heightFt));
        onMove(id, newX, newY);
        newPositions.push({ ...item, x: newX, y: newY });
      }
      setFloatingToolbarPosition(computeGroupAnchor(selectedIds, newPositions));
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, items, getMenuItems, onMove, onDeleteItems, onCopyItem, widthFt, heightFt]);

  const [zoom, setZoom] = useState<(typeof ZOOM_LEVELS)[number]>(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      const parsed = Number(stored);
      if (ZOOM_LEVELS.includes(parsed as (typeof ZOOM_LEVELS)[number])) {
        return parsed as (typeof ZOOM_LEVELS)[number];
      }
    }
    return defaultZoom;
  });

  function handleZoomChange(level: (typeof ZOOM_LEVELS)[number]) {
    setZoom(level);
    if (storageKey) localStorage.setItem(storageKey, String(level));
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (target.closest('[role="dialog"], [role="alertdialog"]')) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        onPasteItem?.();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        onUndo?.();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const applyZoom = (level: (typeof ZOOM_LEVELS)[number]) => {
        setZoom(level);
        if (storageKey) localStorage.setItem(storageKey, String(level));
      };
      if (e.key === '=' || e.key === '+') {
        const next = ZOOM_LEVELS[ZOOM_LEVELS.indexOf(zoom) + 1];
        if (next !== undefined) { e.preventDefault(); applyZoom(next); }
      } else if (e.key === '-') {
        const prev = ZOOM_LEVELS[ZOOM_LEVELS.indexOf(zoom) - 1];
        if (prev !== undefined) { e.preventDefault(); applyZoom(prev); }
      } else if (e.key === '?') {
        e.preventDefault();
        setShowHelp(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [zoom, storageKey, onPasteItem, onUndo, onRedo]);

  const viewBox = `${-PAD} ${-PAD} ${widthFt + PAD * 2} ${heightFt + PAD * 2}`;
  const gridCols = Math.ceil(widthFt);
  const gridRows = Math.ceil(heightFt);

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
        setFloatingToolbarPosition(null);
      } else {
        onEmptyClick(
          Math.max(0, Math.min(coords.x, widthFt)),
          Math.max(0, Math.min(coords.y, heightFt)),
        );
      }
    }
    bgClickStart.current = null;
  }

  const toolbarStyle = toolbarAnchor ? {
    position: 'fixed' as const,
    top: toolbarAnchor.top - 44,
    left: toolbarAnchor.left + toolbarAnchor.width / 2,
    transform: 'translateX(-50%)',
    zIndex: 50,
  } : null;

  return (
    <div ref={containerRef} className="space-y-2">
      <div className="flex justify-end gap-1">
        {ZOOM_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => handleZoomChange(level)}
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
          if (e.target === e.currentTarget) {
            setSelectedIds(new Set());
            setFloatingToolbarPosition(null);
          }
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

          {/* 1-ft grid lines */}
          {Array.from({ length: gridCols + 1 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={i} y1={0} x2={i} y2={heightFt}
              stroke="currentColor"
              strokeWidth={0.025}
              className="text-border/50"
              pointerEvents="none"
            />
          ))}
          {Array.from({ length: gridRows + 1 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0} y1={i} x2={widthFt} y2={i}
              stroke="currentColor"
              strokeWidth={0.025}
              className="text-border/50"
              pointerEvents="none"
            />
          ))}

          {/* Axis labels */}
          {Array.from({ length: gridCols + 1 }, (_, i) => (
            <text
              key={`xl${i}`}
              x={i}
              y={-PAD * 0.4}
              textAnchor="middle"
              fontSize={PAD * 0.55}
              className="fill-muted-foreground"
              pointerEvents="none"
              style={{ letterSpacing: 0 }}
            >
              {i}
            </text>
          ))}

          {/* Boundary outline */}
          <rect
            x={0} y={0} width={widthFt} height={heightFt}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.05}
            className="text-border"
            pointerEvents="none"
          />

          {/* Placed items */}
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

        {/* Floating selection toolbar */}
        {toolbarStyle && selectedIds.size > 0 && selectedIds.size === 1 && (() => {
          const [id] = selectedIds;
          const menuItems = getMenuItems(id);
          const primary = menuItems.filter((mi) => mi.primary);
          const overflow = menuItems.filter((mi) => !mi.primary);
          return (
            <div
              style={toolbarStyle}
              className="flex items-center bg-popover border border-border rounded-lg shadow-lg px-1 py-1"
            >
              {primary.map((mi) => (
                <button
                  key={mi.label}
                  type="button"
                  aria-label={mi.label}
                  onClick={() => { mi.onClick(); setSelectedIds(new Set()); setFloatingToolbarPosition(null); }}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-muted',
                    mi.variant === 'destructive' ? 'text-destructive' : '',
                  )}
                >
                  {mi.icon && <span className="[&>svg]:size-3">{mi.icon}</span>}
                  {mi.label}
                  {mi.shortcut && (
                    <kbd className="ml-0.5 font-mono text-[10px] opacity-50">{mi.shortcut}</kbd>
                  )}
                </button>
              ))}

              {overflow.length > 0 && (
                <>
                  {primary.length > 0 && <div className="w-px h-4 bg-border mx-0.5" />}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="flex items-center px-2 py-1 rounded text-xs hover:bg-muted text-muted-foreground"
                    >
                      <MoreHorizontalIcon className="size-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="bottom" align="end">
                      {overflow.map((mi) => (
                        <DropdownMenuItem
                          key={mi.label}
                          variant={mi.variant}
                          onClick={() => { mi.onClick(); setSelectedIds(new Set()); setFloatingToolbarPosition(null); }}
                        >
                          {mi.icon}
                          {mi.label}
                          {mi.shortcut && (
                            <kbd className="ml-auto pl-4 font-mono text-xs opacity-50">{mi.shortcut}</kbd>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          );
        })()}

        {toolbarStyle && selectedIds.size > 1 && (
          <div
            style={toolbarStyle}
            className="flex items-center bg-popover border border-border rounded-lg shadow-lg px-1 py-1"
          >
            <span className="px-2 text-xs text-muted-foreground">{selectedIds.size} selected</span>
            <div className="w-px h-4 bg-foreground/20 mx-0.5 self-center" />
            <button
              type="button"
              onClick={() => {
                onDeleteItems?.(Array.from(selectedIds));
                setSelectedIds(new Set());
                setFloatingToolbarPosition(null);
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-muted text-destructive"
            >
              <Trash2Icon className="size-3" />
              Delete all
            </button>
          </div>
        )}
      </div>

      <CanvasShortcutsDialog open={showHelp} onOpenChange={setShowHelp} />
    </div>
  );
}
