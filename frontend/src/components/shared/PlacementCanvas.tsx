import { useRef, useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

import type { CanvasItem, CanvasMenuItem } from '@/types/canvas';

interface PlacementCanvasProps {
  widthFt: number;
  heightFt: number;
  items: CanvasItem[];
  renderItem: (item: CanvasItem) => React.ReactNode;
  onEmptyClick: (xFt: number, yFt: number) => void;
  onMove: (id: string, xFt: number, yFt: number) => void;
  onResize?: (id: string, widthFt: number, heightFt: number) => void;
  getMenuItems: (id: string) => CanvasMenuItem[];
}

const PAD = 0.4;
const CLICK_THRESHOLD_FT = 0.15;
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

function DraggableItem({
  item,
  containerWidthFt,
  containerHeightFt,
  renderItem,
  onMove,
  onResize,
  onMenuOpen,
  isMenuActive,
}: {
  item: CanvasItem;
  containerWidthFt: number;
  containerHeightFt: number;
  renderItem: (item: CanvasItem) => React.ReactNode;
  onMove: (id: string, x: number, y: number) => void;
  onResize?: (id: string, widthFt: number, heightFt: number) => void;
  onMenuOpen: (id: string, x: number, y: number) => void;
  isMenuActive: boolean;
}) {
  const [pos, setPos] = useState({ x: item.x, y: item.y });
  const [size, setSize] = useState({ w: item.widthFt, h: item.heightFt });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStart = useRef<{
    svgX: number;
    svgY: number;
    itemX: number;
    itemY: number;
  } | null>(null);
  const resizeStart = useRef<{ svgX: number; svgY: number; w: number; h: number } | null>(null);
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
    };
    setIsDragging(true);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }

  function handleResizePointerDown(e: React.PointerEvent<SVGRectElement>) {
    e.stopPropagation();
    const svg = gRef.current!.ownerSVGElement!;
    const coords = toSVGPoint(e.nativeEvent, svg);
    resizeStart.current = { svgX: coords.x, svgY: coords.y, w: size.w, h: size.h };
    setIsResizing(true);
    gRef.current!.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<SVGGElement>) {
    if (isDragging && dragStart.current) {
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
    } else if (isResizing && resizeStart.current) {
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
      if (pos.x !== item.x || pos.y !== item.y) {
        onMove(item.id, pos.x, pos.y);
      }
    } else if (isResizing) {
      setIsResizing(false);
      resizeStart.current = null;
      if (size.w !== item.widthFt || size.h !== item.heightFt) {
        onResize?.(item.id, size.w, size.h);
      }
    }
  }

  // Scale handle to the canvas so it stays a consistent physical size across bed sizes
  const hs = Math.max(0.144, Math.min(containerWidthFt * 0.034, 0.42));
  const dotR = hs * 0.074;
  const dotSpacing = hs * 0.2;
  const buttonX = size.w - hs;
  const menuCx = buttonX + hs / 2;
  const menuCy = hs / 2;
  const resizeY = size.h - hs;
  const showControls = (isHovered || isMenuActive) && !isDragging && !isResizing;

  return (
    <g
      ref={gRef}
      style={{ cursor: isDragging ? 'grabbing' : isResizing ? 'se-resize' : 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onLostPointerCapture={handleLostPointerCapture}
    >
      <g
        transform={`translate(${pos.x}, ${pos.y})`}
        opacity={isDragging || isResizing ? 0.65 : 1}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {/* Transparent hit rect — gives the <g> a defined area so pointerEnter/Leave fire reliably */}
        <rect x={0} y={0} width={size.w} height={size.h} fill="transparent" />

        {renderItem({ ...item, x: pos.x, y: pos.y, widthFt: size.w, heightFt: size.h })}

        {/* SVG context menu button — top-right corner */}
        {showControls && (
          <>
            <rect
              x={buttonX}
              y={0}
              width={hs}
              height={hs}
              rx={hs * 0.22}
              fill="rgba(0,0,0,0.55)"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth={hs * 0.11}
              style={{ cursor: 'pointer' }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onMenuOpen(item.id, e.clientX, e.clientY);
              }}
            />
            <circle cx={menuCx - dotSpacing} cy={menuCy} r={dotR} fill="white" pointerEvents="none" />
            <circle cx={menuCx}              cy={menuCy} r={dotR} fill="white" pointerEvents="none" />
            <circle cx={menuCx + dotSpacing} cy={menuCy} r={dotR} fill="white" pointerEvents="none" />

            {/* Resize handle — bottom-right corner, x-aligned with menu button */}
            {onResize && (
              <g style={{ cursor: 'se-resize' }} onPointerDown={handleResizePointerDown}>
                <rect
                  x={buttonX}
                  y={resizeY}
                  width={hs}
                  height={hs}
                  rx={hs * 0.22}
                  fill="rgba(0,0,0,0.55)"
                  stroke="rgba(255,255,255,0.45)"
                  strokeWidth={hs * 0.11}
                />
                {/* Corner bracket pointing SE */}
                <path
                  d={`M ${buttonX + hs * 0.52},${resizeY + hs * 0.74} L ${buttonX + hs * 0.74},${resizeY + hs * 0.74} L ${buttonX + hs * 0.74},${resizeY + hs * 0.52}`}
                  stroke="white"
                  strokeWidth={hs * 0.148}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  opacity={0.85}
                  pointerEvents="none"
                />
              </g>
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
}: PlacementCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const bgClickStart = useRef<{ x: number; y: number } | null>(null);
  const [svgMenu, setSvgMenu] = useState<{ id: string; x: number; y: number } | null>(null);

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
      onEmptyClick(
        Math.max(0, Math.min(coords.x, widthFt)),
        Math.max(0, Math.min(coords.y, heightFt)),
      );
    }
    bgClickStart.current = null;
  }

  // Virtual anchor so Base UI positions the menu at the SVG button's screen coordinates
  const menuAnchor = svgMenu
    ? {
        getBoundingClientRect: () => ({
          x: svgMenu.x,
          y: svgMenu.y,
          width: 0,
          height: 0,
          top: svgMenu.y,
          left: svgMenu.x,
          right: svgMenu.x,
          bottom: svgMenu.y,
          toJSON: () => ({}),
        }),
      }
    : undefined;

  return (
    <div className="overflow-auto">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="w-full h-auto"
        style={{ maxHeight: '65vh', minHeight: '200px' }}
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
            stroke="currentColor" strokeWidth={0.025}
            className="text-border/50"
            pointerEvents="none"
          />
        ))}
        {Array.from({ length: gridRows + 1 }, (_, i) => (
          <line
            key={`h${i}`}
            x1={0} y1={i} x2={widthFt} y2={i}
            stroke="currentColor" strokeWidth={0.025}
            className="text-border/50"
            pointerEvents="none"
          />
        ))}

        {/* Axis labels */}
        {Array.from({ length: gridCols + 1 }, (_, i) => (
          <text
            key={`xl${i}`}
            x={i} y={-PAD * 0.4}
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
          x={0} y={0}
          width={widthFt} height={heightFt}
          fill="none"
          stroke="currentColor" strokeWidth={0.05}
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
            renderItem={renderItem}
            onMove={onMove}
            onResize={onResize}
            onMenuOpen={(id, x, y) => setSvgMenu({ id, x, y })}
            isMenuActive={svgMenu?.id === item.id}
          />
        ))}
      </svg>

      {/* Menu lives outside the SVG so Base UI's HTML trigger works correctly */}
      {svgMenu && (
        <DropdownMenu open onOpenChange={(open) => { if (!open) setSvgMenu(null); }}>
          <DropdownMenuContent side="bottom" align="end" anchor={menuAnchor}>
            {getMenuItems(svgMenu.id).map((mi) => (
              <DropdownMenuItem
                key={mi.label}
                variant={mi.variant}
                onClick={() => { mi.onClick(); setSvgMenu(null); }}
              >
                {mi.icon}
                {mi.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
