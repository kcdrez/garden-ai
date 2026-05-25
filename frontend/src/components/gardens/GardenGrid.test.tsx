import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { fetchBedPlacements, deleteBedPlacement } from '@/api/beds';
import { mockGarden, mockBed } from '@/test/fixtures';
import type { GridPlacement } from '@/components/shared/PlacementGrid';
import GardenGrid from './GardenGrid';

vi.mock('@/api/beds', () => ({
  fetchBedPlacements: vi.fn(),
  createBedPlacement: vi.fn(),
  deleteBedPlacement: vi.fn(),
}));

vi.mock('@/components/shared/PlacementGrid', () => ({
  default: ({
    cols,
    rows,
    placements,
    onEmptyCellClick,
    onRemove,
  }: {
    cols: number;
    rows: number;
    placements: GridPlacement[];
    onEmptyCellClick: (x: number, y: number) => void;
    onRemove: (id: string) => void;
  }) => (
    <div data-testid="placement-grid" data-cols={cols} data-rows={rows}>
      <button onClick={() => onEmptyCellClick(0, 0)}>Click cell</button>
      {placements.map((p) => (
        <button key={p.id} onClick={() => onRemove(p.id)}>
          Remove {p.id}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/components/gardens/PlaceBedDialog', () => ({
  default: ({
    open,
    onOpenChange,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Place Bed">
        <button onClick={() => onOpenChange(false)}>Cancel</button>
      </div>
    ) : null,
}));

const gardenWithDims = { ...mockGarden, length: 10, width: 8 };

const mockBedPlacement = {
  id: 'bp-1',
  bed: 'bed-1',
  garden: 'garden-1',
  x: 0,
  y: 0,
  width: 4,
  height: 4,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.mocked(fetchBedPlacements).mockResolvedValue([]);
  vi.mocked(deleteBedPlacement).mockResolvedValue(undefined);
});

describe('GardenGrid', () => {
  it('renders nothing when the garden has no dimensions', async () => {
    const { container } = render(
      <GardenGrid gardenId="garden-1" garden={mockGarden} beds={[]} />,
    );
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('shows a loading spinner while placements load', () => {
    vi.mocked(fetchBedPlacements).mockImplementation(() => new Promise(() => {}));
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[]} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders PlacementGrid with dimensions derived from the garden', async () => {
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[]} />);
    const grid = await screen.findByTestId('placement-grid');
    // width 8 ft → 8 cols, length 10 ft → 10 rows
    expect(grid).toHaveAttribute('data-cols', '8');
    expect(grid).toHaveAttribute('data-rows', '10');
  });

  it('opens the place bed dialog when an empty cell is clicked', async () => {
    const user = userEvent.setup();
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    await user.click(screen.getByRole('button', { name: /click cell/i }));

    expect(screen.getByRole('dialog', { name: /place bed/i })).toBeInTheDocument();
  });

  it('calls deleteBedPlacement when a placement is removed', async () => {
    const user = userEvent.setup();
    vi.mocked(fetchBedPlacements).mockResolvedValue([mockBedPlacement]);
    render(<GardenGrid gardenId="garden-1" garden={gardenWithDims} beds={[mockBed]} />);
    await screen.findByTestId('placement-grid');

    await user.click(screen.getByRole('button', { name: /remove bp-1/i }));

    await waitFor(() =>
      expect(deleteBedPlacement).toHaveBeenCalledWith('garden-1', 'bp-1'),
    );
  });
});
