import { RotateCwIcon } from 'lucide-react';

interface CompassRoseProps {
  orientation: number;
  onClick: () => void;
}

export default function CompassRose({ orientation, onClick }: CompassRoseProps) {
  return (
    <button
      type="button"
      data-testid="compass-rose"
      onClick={onClick}
      title="Rotate north orientation 45°"
      aria-label="North orientation"
      className="flex items-center gap-2 px-3 py-1 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
    >
        <svg viewBox="0 0 32 32" width="24" height="24" className="shrink-0" aria-hidden="true">
          <circle cx="16" cy="16" r="14.5" className="fill-muted/30 stroke-border" strokeWidth="1" />
          <g transform={`rotate(${orientation}, 16, 16)`}>
            <polygon points="16,3 12.5,16 19.5,16" className="fill-destructive" opacity={0.9} />
            <polygon points="16,29 12.5,16 19.5,16" className="fill-muted-foreground" opacity={0.45} />
            <circle cx="16" cy="16" r="2" className="fill-background stroke-border" strokeWidth="0.5" />
          </g>
          <text x="16" y="9.5" textAnchor="middle" fontSize="5.5" fontWeight="bold" className="fill-destructive" style={{ userSelect: 'none' }}>N</text>
        </svg>
        <span className="font-medium text-foreground">North</span>
        <RotateCwIcon className="size-3.5 opacity-50" />
    </button>
  );
}
