import { useRef, useState, useEffect } from 'react';
import type { CanvasItem } from '@/types/canvas';
import { DRAG_THRESHOLD_PX, MIN_PLACEMENT_SIZE, toSVGPoint } from '@/components/shared/placementCanvas.utils';

export function DraggableItem({
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
