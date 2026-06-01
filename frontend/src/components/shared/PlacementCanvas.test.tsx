import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import PlacementCanvas from './PlacementCanvas';
import type { CanvasItem } from '@/types/canvas';

const item: CanvasItem = { id: 'item-1', x: 1, y: 1, widthFt: 1.5, heightFt: 1.5 };

const defaultProps = {
  widthFt: 4,
  heightFt: 4,
  items: [] as CanvasItem[],
  renderItem: vi.fn(() => <rect data-testid="rendered-item" />),
  onEmptyClick: vi.fn(),
  onMove: vi.fn(),
  getMenuItems: vi.fn(() => [
    { label: 'Edit', onClick: vi.fn() },
    { label: 'Delete', onClick: vi.fn(), variant: 'destructive' as const },
  ]),
};

beforeAll(() => {
  // jsdom does not implement SVGSVGElement.createSVGPoint / getScreenCTM.
  // Stub with an identity transform so pointer-event tests reach the real logic.
  Object.defineProperty(SVGSVGElement.prototype, 'createSVGPoint', {
    configurable: true,
    writable: true,
    value() {
      let _x = 0, _y = 0;
      return {
        get x() { return _x; },
        set x(v: number) { _x = v; },
        get y() { return _y; },
        set y(v: number) { _y = v; },
        matrixTransform() { return { x: _x, y: _y }; },
      };
    },
  });
  Object.defineProperty(SVGSVGElement.prototype, 'getScreenCTM', {
    configurable: true,
    writable: true,
    value() { return { inverse() { return {}; } }; },
  });
  // jsdom's setPointerCapture can throw for unrecognised pointer IDs — no-op it.
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
});

beforeEach(() => {
  vi.clearAllMocks();
  defaultProps.renderItem.mockReturnValue(<rect data-testid="rendered-item" />);
  defaultProps.getMenuItems.mockReturnValue([
    { label: 'Edit', onClick: vi.fn() },
    { label: 'Delete', onClick: vi.fn(), variant: 'destructive' as const },
  ]);
});

describe('PlacementCanvas', () => {
  it('renders an SVG canvas', () => {
    const { container } = render(<PlacementCanvas {...defaultProps} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('calls renderItem for each item', () => {
    render(<PlacementCanvas {...defaultProps} items={[item]} />);
    expect(defaultProps.renderItem).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'item-1' }),
    );
    expect(screen.getByTestId('rendered-item')).toBeInTheDocument();
  });

  it('does not call renderItem when items is empty', () => {
    render(<PlacementCanvas {...defaultProps} items={[]} />);
    expect(defaultProps.renderItem).not.toHaveBeenCalled();
  });

  it('calls onEmptyClick when the bg is clicked (pointerDown + pointerUp at same coords)', () => {
    const { container } = render(<PlacementCanvas {...defaultProps} />);
    const bgRect = container.querySelector('rect')!;
    fireEvent.pointerDown(bgRect, { clientX: 2, clientY: 2 });
    fireEvent.pointerUp(bgRect, { clientX: 2, clientY: 2 });
    expect(defaultProps.onEmptyClick).toHaveBeenCalledWith(2, 2);
  });

  it('does not call onEmptyClick when pointerUp fires without a prior pointerDown', () => {
    const { container } = render(<PlacementCanvas {...defaultProps} />);
    const bgRect = container.querySelector('rect');
    fireEvent.pointerUp(bgRect!);
    expect(defaultProps.onEmptyClick).not.toHaveBeenCalled();
  });

  it('does not call onEmptyClick when the bg is dragged (coords too far apart)', () => {
    const { container } = render(<PlacementCanvas {...defaultProps} />);
    const bgRect = container.querySelector('rect')!;
    fireEvent.pointerDown(bgRect, { clientX: 0, clientY: 0 });
    fireEvent.pointerUp(bgRect, { clientX: 2, clientY: 2 });
    expect(defaultProps.onEmptyClick).not.toHaveBeenCalled();
  });

  it('calls onMove when an item is dragged to a new position', () => {
    const { container } = render(<PlacementCanvas {...defaultProps} items={[item]} />);
    const outerG = container.querySelector('g')!;
    fireEvent.pointerDown(outerG, { clientX: 1.75, clientY: 1.75 });
    fireEvent.pointerMove(outerG, { clientX: 2.5, clientY: 2.5 });
    fireEvent.lostPointerCapture(outerG);
    expect(defaultProps.onMove).toHaveBeenCalledWith('item-1', expect.any(Number), expect.any(Number));
  });

  it('does not call onMove when item is released without moving', () => {
    const { container } = render(<PlacementCanvas {...defaultProps} items={[item]} />);
    const outerG = container.querySelector('g')!;
    fireEvent.pointerDown(outerG, { clientX: 1.75, clientY: 1.75 });
    fireEvent.lostPointerCapture(outerG);
    expect(defaultProps.onMove).not.toHaveBeenCalled();
  });

  it('does not call onMove when lostPointerCapture fires before any drag', () => {
    const { container } = render(<PlacementCanvas {...defaultProps} items={[item]} />);
    const outerG = container.querySelector('g');
    fireEvent.lostPointerCapture(outerG!);
    expect(defaultProps.onMove).not.toHaveBeenCalled();
  });

  it('shows context menu items when the menu button is clicked', async () => {
    const { container } = render(<PlacementCanvas {...defaultProps} items={[item]} />);

    // hover to reveal the menu button
    const innerG = container.querySelectorAll('g')[1];
    fireEvent.pointerEnter(innerG);

    // click the menu circle (onClick uses clientX/Y only — no SVG transform)
    const menuCircle = container.querySelector('rect[fill="rgba(0,0,0,0.55)"]');
    fireEvent.click(menuCircle!);

    expect(screen.getByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls the menu item onClick and closes the menu when an item is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    defaultProps.getMenuItems.mockReturnValue([{ label: 'Edit', onClick: onEdit }]);

    const { container } = render(<PlacementCanvas {...defaultProps} items={[item]} />);

    const innerG = container.querySelectorAll('g')[1];
    fireEvent.pointerEnter(innerG);
    fireEvent.click(container.querySelector('rect[fill="rgba(0,0,0,0.55)"]')!);

    await user.click(screen.getByRole('menuitem', { name: /edit/i }));

    expect(onEdit).toHaveBeenCalled();
    expect(screen.queryByRole('menuitem', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('calls getMenuItems with the clicked item id', () => {
    const { container } = render(<PlacementCanvas {...defaultProps} items={[item]} />);

    const innerG = container.querySelectorAll('g')[1];
    fireEvent.pointerEnter(innerG);
    fireEvent.click(container.querySelector('rect[fill="rgba(0,0,0,0.55)"]')!);

    expect(defaultProps.getMenuItems).toHaveBeenCalledWith('item-1');
  });

  it('hides the menu button after pointerLeave', () => {
    const { container } = render(<PlacementCanvas {...defaultProps} items={[item]} />);
    const innerG = container.querySelectorAll('g')[1];
    fireEvent.pointerEnter(innerG);
    expect(container.querySelector('rect[fill="rgba(0,0,0,0.55)"]')).toBeInTheDocument();
    fireEvent.pointerLeave(innerG);
    expect(container.querySelector('rect[fill="rgba(0,0,0,0.55)"]')).not.toBeInTheDocument();
  });

  it('ignores pointerMove before drag starts', () => {
    const { container } = render(<PlacementCanvas {...defaultProps} items={[item]} />);
    const outerG = container.querySelector('g')!;
    fireEvent.pointerMove(outerG, { clientX: 2, clientY: 2 });
    expect(defaultProps.onMove).not.toHaveBeenCalled();
  });

  it('calls onMove when only y changes', () => {
    const { container } = render(<PlacementCanvas {...defaultProps} items={[item]} />);
    const outerG = container.querySelector('g')!;
    fireEvent.pointerDown(outerG, { clientX: 1.75, clientY: 1.75 });
    fireEvent.pointerMove(outerG, { clientX: 1.75, clientY: 2.5 });
    fireEvent.lostPointerCapture(outerG);
    expect(defaultProps.onMove).toHaveBeenCalledWith('item-1', expect.any(Number), expect.any(Number));
  });

  it('calls onResize when the resize handle is dragged to a new size', () => {
    const onResize = vi.fn();
    const { container } = render(
      <PlacementCanvas {...defaultProps} items={[item]} onResize={onResize} />,
    );
    const innerG = container.querySelectorAll('g')[1];
    fireEvent.pointerEnter(innerG);
    const resizeHandleG = container.querySelectorAll('g')[2];
    fireEvent.pointerDown(resizeHandleG, { clientX: 2.0, clientY: 2.0, pointerId: 1 });
    const outerG = container.querySelector('g')!;
    fireEvent.pointerMove(outerG, { clientX: 3.0, clientY: 3.0 });
    fireEvent.lostPointerCapture(outerG);
    expect(onResize).toHaveBeenCalledWith('item-1', expect.any(Number), expect.any(Number));
  });

  it('does not call onResize when the resize handle is released without moving', () => {
    const onResize = vi.fn();
    const { container } = render(
      <PlacementCanvas {...defaultProps} items={[item]} onResize={onResize} />,
    );
    const innerG = container.querySelectorAll('g')[1];
    fireEvent.pointerEnter(innerG);
    const resizeHandleG = container.querySelectorAll('g')[2];
    fireEvent.pointerDown(resizeHandleG, { clientX: 2.0, clientY: 2.0, pointerId: 1 });
    const outerG = container.querySelector('g')!;
    fireEvent.lostPointerCapture(outerG);
    expect(onResize).not.toHaveBeenCalled();
  });

  // --- Zoom ---

  it('renders zoom buttons for all levels', () => {
    render(<PlacementCanvas {...defaultProps} />);
    for (const label of ['0.5×', '0.75×', '1×', '1.5×', '2×', '3×']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('defaults to 0.75x zoom', () => {
    const { container } = render(<PlacementCanvas {...defaultProps} />);
    const svg = container.querySelector('svg')!;
    expect(svg.style.width).toBe('75%');
  });

  it('changes SVG width when a zoom button is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<PlacementCanvas {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: '2×' }));
    expect(container.querySelector('svg')!.style.width).toBe('200%');
  });

  it('centers the SVG when zoom is below 1', async () => {
    const user = userEvent.setup();
    const { container } = render(<PlacementCanvas {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: '0.5×' }));
    expect(container.querySelector('svg')!.style.margin).toBe('0px auto');
  });

  it('does not center the SVG when zoom is 1 or above', async () => {
    const user = userEvent.setup();
    const { container } = render(<PlacementCanvas {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: '1×' }));
    expect(container.querySelector('svg')!.style.margin).toBe('');
  });
});
