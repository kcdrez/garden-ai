import { PAD } from '@/components/shared/placementCanvas.utils';

type Props = {
  widthFt: number;
  heightFt: number;
};

export default function PlacementGrid({ widthFt, heightFt }: Props) {
  const gridCols = Math.ceil(widthFt);
  const gridRows = Math.ceil(heightFt);

  return (
    <>
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
    </>
  );
}
