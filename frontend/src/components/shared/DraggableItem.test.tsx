import { render, screen } from '@/test/test-utils';
import { fireEvent } from '@testing-library/react';
import { DraggableItem } from './DraggableItem';
import type { CanvasItem } from '@/types/canvas';

const item: CanvasItem = { id: 'p1', x: 1, y: 1, widthFt: 2, heightFt: 2 };

const defaultProps = {
  item,
  containerWidthFt: 10,
  containerHeightFt: 10,
  zoom: 1,
  renderItem: vi.fn(() => <rect data-testid="rendered-item" />),
  onMove: vi.fn(),
  onSelect: vi.fn(),
  isSelected: false,
  isInGroup: false,
  groupDelta: null,
};

function renderInSvg(extra: Partial<Parameters<typeof DraggableItem>[0]> = {}) {
  const merged = { ...defaultProps, ...extra };
  const result = render(
    <svg>
      <DraggableItem {...merged} />
    </svg>,
  );
  return result;
}

beforeAll(() => {
  Object.defineProperty(SVGSVGElement.prototype, 'createSVGPoint', {
    configurable: true, writable: true,
    value() {
      let _x = 0, _y = 0;
      return {
        get x() { return _x; }, set x(v: number) { _x = v; },
        get y() { return _y; }, set y(v: number) { _y = v; },
        matrixTransform() { return { x: _x, y: _y }; },
      };
    },
  });
  Object.defineProperty(SVGSVGElement.prototype, 'getScreenCTM', {
    configurable: true, writable: true,
    value() { return { inverse() { return {}; } }; },
  });
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

beforeEach(() => vi.clearAllMocks());

describe('DraggableItem', () => {
  it('renders via renderItem callback', () => {
    renderInSvg();
    expect(defaultProps.renderItem).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }));
    expect(screen.getByTestId('rendered-item')).toBeInTheDocument();
  });

  it('shows selection ring when isSelected', () => {
    const { container } = renderInSvg({ isSelected: true });
    // Selection ring is a dashed rect — look for its strokeDasharray style
    const rects = container.querySelectorAll('rect');
    const ring = Array.from(rects).find(r => r.style.strokeDasharray);
    expect(ring).toBeInTheDocument();
  });

  it('does not show selection ring when not selected', () => {
    const { container } = renderInSvg({ isSelected: false });
    const rects = container.querySelectorAll('rect');
    const ring = Array.from(rects).find(r => r.style.strokeDasharray);
    expect(ring).toBeUndefined();
  });

  it('shows resize handle when selected, onResize provided, not in group, not rotated', () => {
    renderInSvg({ isSelected: true, onResize: vi.fn(), isInGroup: false });
    expect(screen.getByTestId('resize-handle')).toBeInTheDocument();
  });

  it('hides resize handle when item is rotated', () => {
    renderInSvg({
      item: { ...item, rotation: 45 },
      isSelected: true,
      onResize: vi.fn(),
      isInGroup: false,
    });
    expect(screen.queryByTestId('resize-handle')).not.toBeInTheDocument();
  });

  it('hides resize handle when in a group', () => {
    renderInSvg({ isSelected: true, onResize: vi.fn(), isInGroup: true });
    expect(screen.queryByTestId('resize-handle')).not.toBeInTheDocument();
  });

  it('hides resize handle when onResize is not provided', () => {
    renderInSvg({ isSelected: true, isInGroup: false });
    expect(screen.queryByTestId('resize-handle')).not.toBeInTheDocument();
  });

  it('applies rotation transform around the item center', () => {
    const { container } = renderInSvg({ item: { ...item, rotation: 90 } });
    const innerG = container.querySelectorAll('g')[1];
    expect(innerG.getAttribute('transform')).toContain('rotate(90, 1, 1)');
  });

  it('applies 0° rotation when rotation is undefined', () => {
    const { container } = renderInSvg();
    const innerG = container.querySelectorAll('g')[1];
    expect(innerG.getAttribute('transform')).toContain('rotate(0,');
  });

  it('calls onSelect when clicked without dragging', () => {
    const { container } = renderInSvg();
    const outerG = container.querySelector('g')!;
    fireEvent.pointerDown(outerG, { clientX: 2, clientY: 2 });
    fireEvent.lostPointerCapture(outerG);
    expect(defaultProps.onSelect).toHaveBeenCalledWith('p1', false);
  });

  it('calls onMove when dragged to a new position', () => {
    const { container } = renderInSvg();
    const outerG = container.querySelector('g')!;
    fireEvent.pointerDown(outerG, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(outerG, { clientX: 115, clientY: 115 });
    fireEvent.lostPointerCapture(outerG);
    expect(defaultProps.onMove).toHaveBeenCalledWith('p1', expect.any(Number), expect.any(Number));
  });

  it('does not call onMove when released without moving', () => {
    const { container } = renderInSvg();
    const outerG = container.querySelector('g')!;
    fireEvent.pointerDown(outerG, { clientX: 2, clientY: 2 });
    fireEvent.lostPointerCapture(outerG);
    expect(defaultProps.onMove).not.toHaveBeenCalled();
  });

  it('renders the label as a SVG title when provided', () => {
    const { container } = renderInSvg({ label: 'Tomato' });
    expect(container.querySelector('title')?.textContent).toBe('Tomato');
  });
});
