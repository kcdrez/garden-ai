export const ZOOM_LEVELS = [0.25, 0.5, 1, 2, 3] as const;
export type ZoomLevel = (typeof ZOOM_LEVELS)[number];

export const PAD = 0.4;
export const CLICK_THRESHOLD_FT = 0.15;
export const DRAG_THRESHOLD_PX = 6;
export const MIN_PLACEMENT_SIZE = 0.5;

export type FloatingToolbarPosition = { top: number; left: number; width: number };

export function toSVGPoint(
  e: PointerEvent | MouseEvent,
  svg: SVGSVGElement,
): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
  return { x: svgPt.x, y: svgPt.y };
}

export function toFloatingToolbarPosition(
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
