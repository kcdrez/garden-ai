import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchBedPlacements, createBedPlacement, moveBedPlacement, deleteBedPlacement, deleteBed, updateBed } from '@/api/beds';
import { mockGarden, mockBed } from '@/test/fixtures';
import GardenGrid from './GardenGrid';

vi.mock('@/api/beds', () => ({
  fetchBedPlacements: vi.fn(),
  createBedPlacement: vi.fn(),
  moveBedPlacement: vi.fn(),
  deleteBedPlacement: vi.fn(),
  deleteBed: vi.fn(),
  updateBed: vi.fn(),
}));

vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));

vi.mock('@/components/beds/BedDialog', () => ({
  default: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) =>
    open ? (
      <div role="dialog" aria-label="Edit Bed Dialog">
        <button onClick={() => onOpenChange(false)}>Close Bed Dialog</button>
      </div>
    ) : null,
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('@/components/shared/PlacementCanvas', () => ({
  default: ({ items, onEmptyClick, onMove, onResize, getMenuItems }: {
    items: { id: string }[];
    onEmptyClick: (x: number, y: number) => void;
    onMove: (id: string, x: number, y: number) => void;
    onResize?: (id: string, w: number, h: number) => void;
    getMenuItems: (id: string) => { label: string; onClick: () => void }[];
  }) => (
    <div data-testid="placement-canvas">
      <button onClick={() => onEmptyClick(2.0, 3.0)}>Click canvas</button>
      {items.map((item) => (
        <div key={item.id} data-testid={`canvas-item-${item.id}`}>
          <button onClick={() => onMove(item.id, 5.0, 6.0)}>Drag {item.id}</button>
          {onResize && <button onClick={() => onResize(item.id, 3.0, 3.0)}>Resize {item.id}</button>}
          {getMenuItems(item.id).map((mi) => (
            <button key={mi.label} onClick={mi.onClick}>{mi.label} {item.id}</button>
          ))}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/gardens/PlaceBedDialog', () => ({
  default: ({ open, onPlace, onOpenChange }: { open: boolean; onPlace: (id: string) => void; onOpenChange: (open: boolean) => void }) =>
    open ? (
      <div role="dialog" aria-label="Place Bed Dialog">
        <button onClick={() => onPlace('bed-1')}>Place bed-1</button>
        <button onClick={() => onOpenChange(false)}>Close Place Bed Dialog</button>
      </div>
    ) : null,
}));

const mockFetchBedPlacements = vi.mocked(fetchBedPlacements);
const mockCreateBedPlacement = vi.mocked(createBedPlacement);
const mockMoveBedPlacement = vi.mocked(moveBedPlacement);
const mockDeleteBedPlacement = vi.mocked(deleteBedPlacement);
const mockDeleteBed = vi.mocked(deleteBed);
const mockUpdateBed = vi.mocked(updateBed);

const garden = { ...mockGarden, length: 20, width: 20, unit: 'ft' as const };
const placement = { id: 'bp-1', bed: 'bed-1', garden: 'garden-1', x: 0, y: 0, bedWidthFt: 4, bedHeightFt: 4, createdAt: '', updatedAt: '' };

function renderGardenGrid(beds = [mockBed]) {
  return render(
    <GardenGrid gardenId="garden-1" garden={garden} beds={beds} />,
  );
}

describe('GardenGrid', () => {
  beforeEach(() => {
    mockFetchBedPlacements.mockResolvedValue([]);
    mockCreateBedPlacement.mockResolvedValue(placement);
    mockMoveBedPlacement.mockResolvedValue(placement);
    mockDeleteBedPlacement.mockResolvedValue(undefined);
    mockDeleteBed.mockResolvedValue(undefined);
    mockUpdateBed.mockResolvedValue(mockBed);
  });

  it('returns null when garden has no dimensions', () => {
    const { container } = render(
      <GardenGrid gardenId="garden-1" garden={mockGarden} beds={[mockBed]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows loading spinner while placements load', () => {
    mockFetchBedPlacements.mockReturnValue(new Promise(() => {}));
    renderGardenGrid();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders PlacementCanvas once placements load', async () => {
    renderGardenGrid();
    await screen.findByTestId('placement-canvas');
  });

  it('shows unplaced beds panel when a bed has no placement', async () => {
    renderGardenGrid();
    await screen.findByText(/unplaced beds/i);
    expect(screen.getByText('Raised Bed 1')).toBeInTheDocument();
  });

  it('shows zero state when all beds are placed', async () => {
    mockFetchBedPlacements.mockResolvedValue([placement]);
    renderGardenGrid();
    await screen.findByTestId('placement-canvas');
    expect(screen.getByText(/unplaced beds/i)).toBeInTheDocument();
    expect(screen.getByText(/all beds are placed/i)).toBeInTheDocument();
  });

  it('opens PlaceBedDialog when the canvas is clicked', async () => {
    const user = userEvent.setup();
    renderGardenGrid();
    await screen.findByTestId('placement-canvas');
    await user.click(screen.getByRole('button', { name: /click canvas/i }));
    expect(screen.getByRole('dialog', { name: /place bed dialog/i })).toBeInTheDocument();
  });

  it('calls createBedPlacement with canvas position when a bed is placed', async () => {
    const user = userEvent.setup();
    renderGardenGrid();
    await screen.findByTestId('placement-canvas');
    await user.click(screen.getByRole('button', { name: /click canvas/i }));
    await user.click(screen.getByRole('button', { name: /place bed-1/i }));
    await waitFor(() => {
      expect(mockCreateBedPlacement).toHaveBeenCalledWith(
        'garden-1',
        expect.objectContaining({ bed: 'bed-1', x: 2.0, y: 3.0 }),
      );
    });
  });

  it('calls moveBedPlacement (PATCH) when canvas onMove fires', async () => {
    const user = userEvent.setup();
    mockFetchBedPlacements.mockResolvedValue([placement]);
    renderGardenGrid();
    await screen.findByTestId('canvas-item-bp-1');
    await user.click(screen.getByRole('button', { name: /drag bp-1/i }));
    await waitFor(() => {
      expect(mockMoveBedPlacement).toHaveBeenCalledWith('garden-1', 'bp-1', 5.0, 6.0);
    });
  });

  it('calls deleteBedPlacement when Remove from layout menu item is clicked', async () => {
    const user = userEvent.setup();
    mockFetchBedPlacements.mockResolvedValue([placement]);
    renderGardenGrid();
    await screen.findByTestId('canvas-item-bp-1');
    await user.click(screen.getByRole('button', { name: /Remove From Layout bp-1/i }));
    await waitFor(() => {
      expect(mockDeleteBedPlacement).toHaveBeenCalledWith('garden-1', 'bp-1');
    });
  });

  it('opens BedDialog when Edit menu item is clicked', async () => {
    const user = userEvent.setup();
    mockFetchBedPlacements.mockResolvedValue([placement]);
    renderGardenGrid();
    await screen.findByTestId('canvas-item-bp-1');
    await user.click(screen.getByRole('button', { name: /^edit bp-1$/i }));
    expect(screen.getByRole('dialog', { name: /edit bed dialog/i })).toBeInTheDocument();
  });

  it('calls deleteBed when Delete menu item is clicked', async () => {
    const user = userEvent.setup();
    mockFetchBedPlacements.mockResolvedValue([placement]);
    renderGardenGrid();
    await screen.findByTestId('canvas-item-bp-1');
    await user.click(screen.getByRole('button', { name: /^delete bp-1$/i }));
    await waitFor(() => {
      expect(mockDeleteBed).toHaveBeenCalledWith('garden-1', 'bed-1');
    });
  });

  it('calls updateBed with converted dimensions when canvas onResize fires', async () => {
    const user = userEvent.setup();
    mockFetchBedPlacements.mockResolvedValue([placement]);
    renderGardenGrid();
    await screen.findByTestId('canvas-item-bp-1');
    await user.click(screen.getByRole('button', { name: /resize bp-1/i }));
    await waitFor(() => {
      // mock fires onResize(id, 3.0, 3.0); bed unit is 'ft' so values stay 3.0
      expect(mockUpdateBed).toHaveBeenCalledWith(
        'garden-1',
        'bed-1',
        expect.objectContaining({ width: 3.0, length: 3.0 }),
      );
    });
  });

  it('shows error message when updateBed fails', async () => {
    const user = userEvent.setup();
    mockFetchBedPlacements.mockResolvedValue([placement]);
    mockUpdateBed.mockRejectedValue(
      Object.assign(new Error('resize error'), {
        isAxiosError: true,
        response: { data: { nonFieldErrors: ['Resizing would push plants outside the grid.'] } },
      }),
    );
    renderGardenGrid();
    await screen.findByTestId('canvas-item-bp-1');
    await user.click(screen.getByRole('button', { name: /resize bp-1/i }));
    await waitFor(() => {
      expect(screen.getByText(/resizing would push plants/i)).toBeInTheDocument();
    });
  });

  it('clears error message after a subsequent successful resize', async () => {
    const user = userEvent.setup();
    mockFetchBedPlacements.mockResolvedValue([placement]);
    mockUpdateBed.mockRejectedValueOnce(
      Object.assign(new Error('resize error'), {
        isAxiosError: true,
        response: { data: { nonFieldErrors: ['Resizing would push plants outside the grid.'] } },
      }),
    );
    renderGardenGrid();
    await screen.findByTestId('canvas-item-bp-1');
    await user.click(screen.getByRole('button', { name: /resize bp-1/i }));
    await waitFor(() => {
      expect(screen.getByText(/resizing would push plants/i)).toBeInTheDocument();
    });

    mockUpdateBed.mockResolvedValueOnce(mockBed);
    await user.click(screen.getByRole('button', { name: /resize bp-1/i }));
    await waitFor(() => {
      expect(screen.queryByText(/resizing would push plants/i)).not.toBeInTheDocument();
    });
  });

  it('opens BedDialog when Add Bed button is clicked', async () => {
    const user = userEvent.setup();
    renderGardenGrid();
    await screen.findByTestId('placement-canvas');
    await user.click(screen.getByRole('button', { name: /add bed/i }));
    expect(screen.getByRole('dialog', { name: /edit bed dialog/i })).toBeInTheDocument();
  });

  it('closes PlaceBedDialog and resets state when dialog is dismissed', async () => {
    const user = userEvent.setup();
    renderGardenGrid();
    await screen.findByTestId('placement-canvas');
    await user.click(screen.getByRole('button', { name: /click canvas/i }));
    expect(screen.getByRole('dialog', { name: /place bed dialog/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close place bed dialog/i }));
    expect(screen.queryByRole('dialog', { name: /place bed dialog/i })).not.toBeInTheDocument();
  });

  it('closes edit BedDialog and clears editing state when dialog is dismissed', async () => {
    const user = userEvent.setup();
    mockFetchBedPlacements.mockResolvedValue([placement]);
    renderGardenGrid();
    await screen.findByTestId('canvas-item-bp-1');
    await user.click(screen.getByRole('button', { name: /edit bp-1/i }));
    expect(screen.getByRole('dialog', { name: /edit bed dialog/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close bed dialog/i }));
    expect(screen.queryByRole('dialog', { name: /edit bed dialog/i })).not.toBeInTheDocument();
  });
});
