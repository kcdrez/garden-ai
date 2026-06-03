import { useRef, useState, useEffect } from 'react';
import { MoreHorizontalIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
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


type ToolbarAnchor = { top: number; left: number; width: number };

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
}: {
  item: CanvasItem;
  containerWidthFt: number;
  containerHeightFt: number;
  zoom: number;
  label?: string;
  renderItem: (item: CanvasItem) => React.ReactNode;
  onMove: (id: string, x: number, y: number) => void;
  onResize?: (id: string, widthFt: number, heightFt: number) => void;
  onSelect: (id: string, anchor: ToolbarAnchor) => void;
  isSelected: boolean;
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
      dragStart.current = null;
      if (hasMoved.current) {
        if (pos.x !== item.x || pos.y !== item.y) onMove(item.id, pos.x, pos.y);
        if (isSelected) {
          const svg = gRef.current!.ownerSVGElement!;
          const ctm = svg.getScreenCTM()!;
          const tl = svg.createSVGPoint();
          tl.x = pos.x; tl.y = pos.y;
          const tlScreen = tl.matrixTransform(ctm);
          const tr = svg.createSVGPoint();
          tr.x = pos.x + size.w; tr.y = pos.y;
          const trScreen = tr.matrixTransform(ctm);
          onSelect(item.id, { top: tlScreen.y, left: tlScreen.x, width: trScreen.x - tlScreen.x });
        }
      } else {
        // No movement — treat as a click and select this item
        const svg = gRef.current!.ownerSVGElement!;
        const ctm = svg.getScreenCTM()!;
        const tl = svg.createSVGPoint();
        tl.x = pos.x;
        tl.y = pos.y;
        const tlScreen = tl.matrixTransform(ctm);
        const tr = svg.createSVGPoint();
        tr.x = pos.x + size.w;
        tr.y = pos.y;
        const trScreen = tr.matrixTransform(ctm);
        onSelect(item.id, {
          top: tlScreen.y,
          left: tlScreen.x,
          width: trScreen.x - tlScreen.x,
        });
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
        transform={`translate(${pos.x}, ${pos.y})`}
        opacity={isDragging || isResizing ? 0.65 : 1}
      >
        {label && <title>{label}</title>}
        {/* Transparent hit rect — ensures the <g> has a defined pointer area */}
        <rect x={0} y={0} width={size.w} height={size.h} fill="transparent" />

        {renderItem({ ...item, x: pos.x, y: pos.y, widthFt: size.w, heightFt: size.h })}

        {isSelected && (
          <>
            <rect
              x={-0.06} y={-0.06}
              width={size.w + 0.12} height={size.h + 0.12}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth={0.055}
              strokeDasharray="0.18 0.1"
              rx={0.12}
              pointerEvents="none"
            />
            {onResize && (
              <circle
                cx={size.w} cy={size.h} r={handleR}
                fill="hsl(var(--primary))"
                stroke="white"
                strokeWidth={handleR * 0.35}
                style={{ cursor: 'se-resize' }}
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
  getMenuItems,
  storageKey,
  defaultZoom = 1,
  getItemLabel,
}: PlacementCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bgClickStart = useRef<{ x: number; y: number } | null>(null);
  const [selectedItem, setSelectedItem] = useState<{
    id: string;
    anchor: ToolbarAnchor;
  } | null>(null);

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setSelectedItem(null);
      }
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);
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
      if (selectedItem) {
        setSelectedItem(null);
      } else {
        onEmptyClick(
          Math.max(0, Math.min(coords.x, widthFt)),
          Math.max(0, Math.min(coords.y, heightFt)),
        );
      }
    }
    bgClickStart.current = null;
  }

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
      </div>

      <div
        className="overflow-x-auto min-h-[200px]"
        onPointerDown={(e) => { if (e.target === e.currentTarget) setSelectedItem(null); }}
      >
        <svg
          ref={svgRef}
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
              x1={i}
              y1={0}
              x2={i}
              y2={heightFt}
              stroke="currentColor"
              strokeWidth={0.025}
              className="text-border/50"
              pointerEvents="none"
            />
          ))}
          {Array.from({ length: gridRows + 1 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i}
              x2={widthFt}
              y2={i}
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
            x={0}
            y={0}
            width={widthFt}
            height={heightFt}
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
              onSelect={(id, anchor) => setSelectedItem({ id, anchor })}
              isSelected={selectedItem?.id === item.id}
            />
          ))}
        </svg>

        {/* Floating selection toolbar */}
        {selectedItem &&
          (() => {
            const menuItems = getMenuItems(selectedItem.id);
            const primary = menuItems.filter((mi) => mi.primary);
            const overflow = menuItems.filter((mi) => !mi.primary);
            return (
              <div
                style={{
                  position: 'fixed',
                  top: selectedItem.anchor.top - 44,
                  left: selectedItem.anchor.left + selectedItem.anchor.width / 2,
                  transform: 'translateX(-50%)',
                  zIndex: 50,
                }}
                className="flex items-center bg-popover border border-border rounded-lg shadow-lg px-1 py-1"
              >
                {primary.map((mi) => (
                  <button
                    key={mi.label}
                    type="button"
                    aria-label={mi.label}
                    onClick={() => { mi.onClick(); setSelectedItem(null); }}
                    className={cn(
                      'flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-muted',
                      mi.variant === 'destructive' ? 'text-destructive' : '',
                    )}
                  >
                    {mi.icon && <span className="[&>svg]:size-3">{mi.icon}</span>}
                    {mi.label}
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
                            onClick={() => { mi.onClick(); setSelectedItem(null); }}
                          >
                            {mi.icon}
                            {mi.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            );
          })()}

      </div>
    </div>
  );
}
