import { XIcon } from 'lucide-react';

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
}

export default function PlacementGrid({
  cols,
  rows,
  placements,
  renderCell,
  onEmptyCellClick,
  onRemove,
  isRemoving,
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
              <button
                key={`${col},${row}`}
                className="w-24 h-24 bg-background hover:bg-muted/50 transition-colors"
                style={{ gridColumnStart: col + 1, gridRowStart: row + 1 }}
                onClick={() => onEmptyCellClick(col, row)}
                aria-label={`Place at column ${col + 1}, row ${row + 1}`}
              />
            );
          }

          return (
            <div
              key={`${col},${row}`}
              className="bg-primary/15 relative group flex items-center justify-center p-1 overflow-hidden"
              style={{
                gridColumn: `${col + 1} / span ${placement.width}`,
                gridRow: `${row + 1} / span ${placement.height}`,
              }}
            >
              {renderCell(placement)}
              <button
                className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-destructive/80 text-destructive-foreground transition-colors"
                onClick={() => onRemove(placement.id)}
                disabled={isRemoving}
                aria-label="Remove from grid"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
