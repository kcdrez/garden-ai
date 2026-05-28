import { useRef, useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

export interface CanvasItem {
  id: string;
  x: number;
  y: number;
  widthFt: number;
  heightFt: number;
}

export interface CanvasMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'destructive';
}

interface PlacementCanvasProps {
  widthFt: number;
  heightFt: number;
  items: CanvasItem[];
  renderItem: (item: CanvasItem) => React.ReactNode;
  onEmptyClick: (xFt: number, yFt: number) => void;
  onMove: (id: string, xFt: number, yFt: number) => void;
  getMenuItems: (id: string) => CanvasMenuItem[];
}

const PAD = 0.4;
const CLICK_THRESHOLD_FT = 0.15;

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
  onMenuOpen,
  isMenuActive,
}: {
  item: CanvasItem;
  containerWidthFt: number;
  containerHeightFt: number;
  renderItem: (item: CanvasItem) => React.ReactNode;
  onMove: (id: string, x: number, y: number) => void;
  onMenuOpen: (id: string, x: number, y: number) => void;
  isMenuActive: boolean;
}) {
  const [pos, setPos] = useState({ x: item.x, y: item.y });
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dragStart = useRef<{
    svgX: number;
    svgY: number;
    itemX: number;
    itemY: number;
  } | null>(null);
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!isDragging) setPos({ x: item.x, y: item.y });
  }, [item.x, item.y, isDragging]);

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

  function handlePointerMove(e: React.PointerEvent<SVGGElement>) {
    if (!isDragging || !dragStart.current) return;
    const svg = gRef.current!.ownerSVGElement!;
    const coords = toSVGPoint(e.nativeEvent, svg);
    const newX = Math.max(
      0,
      Math.min(
        dragStart.current.itemX + (coords.x - dragStart.current.svgX),
        containerWidthFt - item.widthFt,
      ),
    );
    const newY = Math.max(
      0,
      Math.min(
        dragStart.current.itemY + (coords.y - dragStart.current.svgY),
        containerHeightFt - item.heightFt,
      ),
    );
    setPos({ x: newX, y: newY });
  }

  function handlePointerUp() {
    if (!isDragging) return;
    setIsDragging(false);
    dragStart.current = null;
    if (pos.x !== item.x || pos.y !== item.y) {
      onMove(item.id, pos.x, pos.y);
    }
  }

  const r = Math.min(item.widthFt, item.heightFt) / 2;
  const cx = item.widthFt / 2;
  const cy = item.heightFt / 2;
  const btnOffset = r * 0.707;
  const btnR = 0.15;
  const dotR = 0.015;
  const dotSpacing = btnR * 0.32;
  const showMenuBtn = (isHovered || isMenuActive) && !isDragging;

  return (
    <g
      ref={gRef}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <g
        transform={`translate(${pos.x}, ${pos.y})`}
        opacity={isDragging ? 0.65 : 1}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
      >
        {/* Transparent hit rect — gives the <g> a defined area so pointerEnter/Leave fire reliably */}
        <rect x={0} y={0} width={item.widthFt} height={item.heightFt} fill="transparent" />

        {renderItem({ ...item, x: pos.x, y: pos.y })}

        {/* SVG button — visual only, click calls back to PlacementCanvas to open the HTML menu */}
        <g
          transform={`translate(${cx + btnOffset}, ${cy - btnOffset})`}
          style={{
            cursor: showMenuBtn ? 'pointer' : 'default',
            opacity: showMenuBtn ? 1 : 0,
            pointerEvents: showMenuBtn ? 'all' : 'none',
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onMenuOpen(item.id, e.clientX, e.clientY);
          }}
        >
          <circle r={btnR} fill="rgba(0,0,0,0.55)" />
          <circle cx={-dotSpacing} cy={0} r={dotR} fill="white" />
          <circle cx={0} cy={0} r={dotR} fill="white" />
          <circle cx={dotSpacing} cy={0} r={dotR} fill="white" />
        </g>
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
