import { useDroppable, useDraggable } from '@dnd-kit/core';
import { GripVertical, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GridPlacement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PlacementGridProps {
  cols: number;
  rows: number;
  placements: GridPlacement[];
  renderCell: (placement: GridPlacement) => React.ReactNode;
  onEmptyCellClick: (x: number, y: number) => void;
  onRemove: (placementId: string) => void;
  isRemoving?: boolean;
  getDropState?: (x: number, y: number) => 'valid' | 'invalid' | null;
}

export function DraggableChip({
  dragId,
  children,
}: {
  dragId: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: dragId });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded text-xs cursor-grab touch-none select-none',
        isDragging && 'opacity-40',
      )}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="size-3 text-muted-foreground shrink-0" />
      {children}
    </div>
  );
}

function DroppableCell({
  col,
  row,
  onClick,
  getDropState,
}: {
  col: number;
  row: number;
  onClick: () => void;
  getDropState?: (x: number, y: number) => 'valid' | 'invalid' | null;
}) {
  const { setNodeRef } = useDroppable({ id: `cell:${col},${row}` });
  const dropState = getDropState?.(col, row) ?? null;
  return (
    <button
      ref={setNodeRef}
      className={cn(
        'w-24 h-24 bg-background transition-colors',
        dropState === 'valid' ? 'bg-primary/20' :
        dropState === 'invalid' ? 'bg-destructive/20' :
        'hover:bg-muted/50',
      )}
      style={{ gridColumnStart: col + 1, gridRowStart: row + 1 }}
      onClick={onClick}
      aria-label={`Place at column ${col + 1}, row ${row + 1}`}
    />
  );
}

function DraggablePlacement({
  placement,
  renderCell,
  onRemove,
  isRemoving,
}: {
  placement: GridPlacement;
  renderCell: (p: GridPlacement) => React.ReactNode;
  onRemove: (id: string) => void;
  isRemoving?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `placed:${placement.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-primary/15 relative group flex items-center justify-center p-1 overflow-hidden cursor-grab touch-none',
        isDragging && 'opacity-30',
      )}
      style={{
        gridColumn: `${placement.x + 1} / span ${placement.width}`,
        gridRow: `${placement.y + 1} / span ${placement.height}`,
      }}
      {...listeners}
      {...attributes}
    >
      {renderCell(placement)}
      <button
        className="absolute top-0.5 right-0.5 hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-colors"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onRemove(placement.id)}
        disabled={isRemoving}
        aria-label="Remove from grid"
      >
        <XIcon className="size-3" />
      </button>
    </div>
  );
}

export default function PlacementGrid({
  cols,
  rows,
  placements,
  renderCell,
  onEmptyCellClick,
  onRemove,
  isRemoving,
  getDropState,
}: PlacementGridProps) {
  const placementByCell = new Map<string, GridPlacement>();
  placements.forEach((p) => {
    for (let dx = 0; dx < p.width; dx++) {
      for (let dy = 0; dy < p.height; dy++) {
        placementByCell.set(`${p.x + dx},${p.y + dy}`, p);
      }
    }
  });

  return (
    <div className="overflow-auto">
      <div
        className="inline-grid gap-px bg-border border border-border rounded p-px"
        style={{ gridTemplateColumns: `repeat(${cols}, 6rem)`, gridTemplateRows: `repeat(${rows}, 6rem)` }}
      >
        {Array.from({ length: rows * cols }, (_, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const placement = placementByCell.get(`${col},${row}`);
          const isOrigin = placement && placement.x === col && placement.y === row;

          if (placement && !isOrigin) return null;

          if (!placement) {
            return (
              <DroppableCell
                key={`${col},${row}`}
                col={col}
                row={row}
                onClick={() => onEmptyCellClick(col, row)}
                getDropState={getDropState}
              />
            );
          }

          return (
            <DraggablePlacement
              key={`${col},${row}`}
              placement={placement}
              renderCell={renderCell}
              onRemove={onRemove}
              isRemoving={isRemoving}
            />
          );
        })}
      </div>
    </div>
  );
}
