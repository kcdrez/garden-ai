import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchBedPlacements, createBedPlacement, moveBedPlacement, deleteBedPlacement } from '@/api/beds';
import { mockGarden, mockBed } from '@/test/fixtures';
import GardenGrid from './GardenGrid';

vi.mock('@/api/beds', () => ({
  fetchBedPlacements: vi.fn(),
  createBedPlacement: vi.fn(),
  moveBedPlacement: vi.fn(),
  deleteBedPlacement: vi.fn(),
}));

vi.mock('@/components/shared/PlacementCanvas', () => ({
  default: ({ items, onEmptyClick, onMove, onRemove }: {
    items: { id: string }[];
    onEmptyClick: (x: number, y: number) => void;
    onMove: (id: string, x: number, y: number) => void;
    onRemove: (id: string) => void;
  }) => (
    <div data-testid="placement-canvas">
      <button onClick={() => onEmptyClick(2.0, 3.0)}>Click canvas</button>
      {items.map((item) => (
        <div key={item.id} data-testid={`canvas-item-${item.id}`}>
          <button onClick={() => onMove(item.id, 5.0, 6.0)}>Drag {item.id}</button>
          <button onClick={() => onRemove(item.id)}>Delete {item.id}</button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/gardens/PlaceBedDialog', () => ({
  default: ({ open, onPlace }: { open: boolean; onPlace: (id: string) => void }) =>
    open ? (
      <div role="dialog" aria-label="Place Bed Dialog">
        <button onClick={() => onPlace('bed-1')}>Place bed-1</button>
      </div>
    ) : null,
}));

const mockFetchBedPlacements = vi.mocked(fetchBedPlacements);
const mockCreateBedPlacement = vi.mocked(createBedPlacement);
const mockMoveBedPlacement = vi.mocked(moveBedPlacement);
const mockDeleteBedPlacement = vi.mocked(deleteBedPlacement);

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

  it('hides unplaced beds panel when all beds are placed', async () => {
    mockFetchBedPlacements.mockResolvedValue([placement]);
    renderGardenGrid();
    await screen.findByTestId('placement-canvas');
    expect(screen.queryByText(/unplaced beds/i)).not.toBeInTheDocument();
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

  it('calls deleteBedPlacement when canvas onRemove fires', async () => {
    const user = userEvent.setup();
    mockFetchBedPlacements.mockResolvedValue([placement]);
    renderGardenGrid();
    await screen.findByTestId('canvas-item-bp-1');
    await user.click(screen.getByRole('button', { name: /delete bp-1/i }));
    await waitFor(() => {
      expect(mockDeleteBedPlacement).toHaveBeenCalledWith('garden-1', 'bp-1');
    });
  });
});
