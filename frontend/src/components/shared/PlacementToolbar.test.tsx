import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import PlacementToolbar from './PlacementToolbar';
import type { CanvasMenuItem } from '@/types/canvas';
import type { FloatingToolbarPosition } from '@/lib/placementCanvas';

const anchor: FloatingToolbarPosition = { top: 100, left: 200, width: 80 };

const makeItem = (label: string, primary = true): CanvasMenuItem => ({
  label,
  onClick: vi.fn(),
  primary,
});

describe('PlacementToolbar — single selection', () => {
  it('renders primary menu items as buttons', () => {
    render(
      <PlacementToolbar
        anchor={anchor}
        selectedCount={1}
        menuItems={[makeItem('Edit'), makeItem('Delete')]}
        onClearSelection={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('calls the item onClick and onClearSelection when a primary button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onClear = vi.fn();
    render(
      <PlacementToolbar
        anchor={anchor}
        selectedCount={1}
        menuItems={[{ label: 'Edit', onClick: onEdit, primary: true }]}
        onClearSelection={onClear}
      />,
    );
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalled();
    expect(onClear).toHaveBeenCalled();
  });

  it('shows shortcut hints on primary buttons', () => {
    render(
      <PlacementToolbar
        anchor={anchor}
        selectedCount={1}
        menuItems={[{ label: 'Edit', onClick: vi.fn(), primary: true, shortcut: 'e' }]}
        onClearSelection={vi.fn()}
      />,
    );
    expect(screen.getByText('e')).toBeInTheDocument();
  });

  it('renders overflow items in a dropdown, not as top-level buttons', () => {
    render(
      <PlacementToolbar
        anchor={anchor}
        selectedCount={1}
        menuItems={[
          makeItem('Primary', true),
          makeItem('Overflow', false),
        ]}
        onClearSelection={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /primary/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /overflow/i })).not.toBeInTheDocument();
  });

  it('positions the toolbar via inline style derived from the anchor', () => {
    const { container } = render(
      <PlacementToolbar
        anchor={anchor}
        selectedCount={1}
        menuItems={[makeItem('Edit')]}
        onClearSelection={vi.fn()}
      />,
    );
    const toolbar = container.firstChild as HTMLElement;
    // top: anchor.top - 44 = 56; left: anchor.left + anchor.width / 2 = 240
    expect(toolbar.style.top).toBe('56px');
    expect(toolbar.style.left).toBe('240px');
  });
});

describe('PlacementToolbar — multi selection', () => {
  it('shows the selected count', () => {
    render(
      <PlacementToolbar
        anchor={anchor}
        selectedCount={3}
        menuItems={[]}
        onClearSelection={vi.fn()}
      />,
    );
    expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
  });

  it('shows a Delete all button', () => {
    render(
      <PlacementToolbar
        anchor={anchor}
        selectedCount={2}
        menuItems={[]}
        onClearSelection={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /delete all/i })).toBeInTheDocument();
  });

  it('calls onDeleteAll and onClearSelection when Delete all is clicked', async () => {
    const user = userEvent.setup();
    const onDeleteAll = vi.fn();
    const onClear = vi.fn();
    render(
      <PlacementToolbar
        anchor={anchor}
        selectedCount={2}
        menuItems={[]}
        onClearSelection={onClear}
        onDeleteAll={onDeleteAll}
      />,
    );
    await user.click(screen.getByRole('button', { name: /delete all/i }));
    expect(onDeleteAll).toHaveBeenCalled();
    expect(onClear).toHaveBeenCalled();
  });

  it('does not render single-selection menu items', () => {
    render(
      <PlacementToolbar
        anchor={anchor}
        selectedCount={2}
        menuItems={[makeItem('Edit')]}
        onClearSelection={vi.fn()}
      />,
    );
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });
});
